import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  catalogProcessingExtensionPoint,
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import YAML from 'yaml';

class AzureBlobEntityProvider implements EntityProvider {
  private connection?: EntityProviderConnection;

  constructor(
    private readonly accountName: string,
    private readonly accountKey: string,
    private readonly containerName: string,
    private readonly prefix: string,
    private readonly logger: { info(m: string): void; warn(m: string): void },
  ) {}

  getProviderName() {
    return `azure-blob-catalog:${this.containerName}`;
  }

  async connect(connection: EntityProviderConnection) {
    this.connection = connection;
  }

  async run() {
    if (!this.connection) {
      this.logger.warn('Azure catalog provider not connected yet, skipping run');
      return;
    }
    this.logger.info(
      `Azure catalog sync: listing ${this.containerName}/${this.prefix}`,
    );

    const service = new BlobServiceClient(
      `https://${this.accountName}.blob.core.windows.net`,
      new StorageSharedKeyCredential(this.accountName, this.accountKey),
    );
    const container = service.getContainerClient(this.containerName);

    const entities = [];
    for await (const blob of container.listBlobsFlat({ prefix: this.prefix })) {
      // match synced_data/<repo>/catalog-info.yaml only (not docs/ contents)
      const rest = blob.name.slice(this.prefix.length);
      if (!/^[^/]+\/catalog-info\.ya?ml$/.test(rest)) continue;

      try {
        const buf = await container.getBlobClient(blob.name).downloadToBuffer();
        const location = `url:https://${this.accountName}.blob.core.windows.net/${this.containerName}/${blob.name}`;
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
        this.logger.warn(`Failed to read ${blob.name}: ${e}`);
      }
    }

    await this.connection.applyMutation({ type: 'full', entities });
    this.logger.info(`Azure catalog sync: ${entities.length} entities`);
  }
}

export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'azure-blob-provider',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        scheduler: coreServices.scheduler,
        logger: coreServices.logger,
      },
      async init({ catalog, config, scheduler, logger }) {
        const base = 'techdocs.publisher.azureBlobStorage';
        const accountName = config.getString(`${base}.credentials.accountName`);
        const accountKey = config.getString(`${base}.credentials.accountKey`);
        const containerName =
          config.getOptionalString('azureBlobCatalog.containerName') ??
          config.getString(`${base}.containerName`);
        const prefix =
          config.getOptionalString('azureBlobCatalog.prefix') ?? 'synced_data/';

        const provider = new AzureBlobEntityProvider(
          accountName,
          accountKey,
          containerName,
          prefix,
          logger,
        );
        catalog.addEntityProvider(provider);

        await scheduler.scheduleTask({
          id: 'azure-blob-catalog-sync',
          frequency: { minutes: 1 },
          initialDelay: { seconds: 15 },
          timeout: { minutes: 1 },
          fn: () => provider.run(),
        });
      },
    });
  },
});