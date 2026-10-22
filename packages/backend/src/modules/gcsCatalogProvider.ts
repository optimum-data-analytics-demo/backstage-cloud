import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  catalogProcessingExtensionPoint,
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import { Storage } from '@google-cloud/storage';
import YAML from 'yaml';

class GcsEntityProvider implements EntityProvider {
  private connection?: EntityProviderConnection;

  constructor(
    private readonly bucketName: string,
    private readonly prefix: string,
    private readonly logger: { info(m: string): void; warn(m: string): void },
  ) {}

  getProviderName() {
    return `gcs-catalog:${this.bucketName}`;
  }

  async connect(connection: EntityProviderConnection) {
    this.connection = connection;
  }

  async run() {
    if (!this.connection) {
      this.logger.warn('GCS catalog provider not connected yet, skipping run');
    return;
    }
      this.logger.info(`GCS catalog sync: listing gs://${this.bucketName}/${this.prefix}`);

    const storage = new Storage(); // uses Application Default Credentials
    const [files] = await storage
      .bucket(this.bucketName)
      .getFiles({ prefix: this.prefix });

    // match synced_data/<repo>/catalog-info.yaml only (not docs/ contents)
    const catalogFiles = files.filter(f => {
      const rest = f.name.slice(this.prefix.length);
      return /^[^/]+\/catalog-info\.ya?ml$/.test(rest);
    });

    const entities = [];
    for (const file of catalogFiles) {
      try {
        const [buf] = await file.download();
        const location = `url:https://storage.googleapis.com/${this.bucketName}/${file.name}`;
        for (const doc of YAML.parseAllDocuments(buf.toString('utf8'))) {
          const entity = doc.toJS();
          if (!entity?.kind) continue;
          entity.metadata.annotations = {
            ...entity.metadata.annotations,
            'backstage.io/managed-by-location': location,
            'backstage.io/managed-by-origin-location': location,
          };
          entities.push({ entity, locationKey: this.getProviderName() });
        }
      } catch (e) {
        this.logger.warn(`Failed to read ${file.name}: ${e}`);
      }
    }

    await this.connection.applyMutation({ type: 'full', entities });
    this.logger.info(`GCS catalog sync: ${entities.length} entities`);
  }
}

export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'gcs-provider',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        scheduler: coreServices.scheduler,
        logger: coreServices.logger,
      },
      async init({ catalog, config, scheduler, logger }) {
        const bucketName = config.getString('gcsCatalog.bucketName');
        const prefix = config.getOptionalString('gcsCatalog.prefix') ?? 'synced_data/';

        const provider = new GcsEntityProvider(bucketName, prefix, logger);
        catalog.addEntityProvider(provider);

        await scheduler.scheduleTask({
          id: 'gcs-catalog-sync',
          frequency: { minutes: 5 },
          initialDelay: { seconds: 15 },
          timeout: { minutes: 3 },
          fn: () => provider.run(),
        });
      },
    });
  },
});