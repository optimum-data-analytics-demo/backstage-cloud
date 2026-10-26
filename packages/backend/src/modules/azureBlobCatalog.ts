import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { parseAllDocuments } from 'yaml';
import type { Entity } from '@backstage/catalog-model';
import type { EntityProvider, EntityProviderConnection } from '@backstage/plugin-catalog-node';

class AzureBlobEntityProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  constructor(
    private readonly account: string,
    private readonly key: string,
    private readonly container: string,
  ) {}

  getProviderName() {
    return 'azure-blob-synced-data';
  }

  async connect(connection: EntityProviderConnection) {
    this.connection = connection;
  }

  async refresh() {
    if (!this.connection) return;
    const client = new BlobServiceClient(
    `https://${this.account}.blob.core.windows.net`,
    new StorageSharedKeyCredential(this.account, this.key),
    );
    const container = client.getContainerClient(this.container);
    const entities: { entity: Entity; locationKey: string }[] = [];

    for await (const blob of container.listBlobsFlat({ prefix: 'synced_data/' })) {
      if (!blob.name.endsWith('/catalog-info.yaml')) continue;
      const buf = await container.getBlobClient(blob.name).downloadToBuffer();
      const location = `url:https://${this.account}.blob.core.windows.net/${this.container}/${blob.name}`;
      for (const doc of parseAllDocuments(buf.toString('utf8'))) {
        const entity = doc.toJS() as Entity | null;
        if (!entity?.kind) continue;
        entity.metadata.annotations = {
          ...entity.metadata.annotations,
          'backstage.io/managed-by-location': location,
          'backstage.io/managed-by-origin-location': location,
        };
        entities.push({ entity, locationKey: location });
      }
    }
    await this.connection.applyMutation({ type: 'full', entities });
  }
}

export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'azure-blob-synced-data',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        scheduler: coreServices.scheduler,
      },
      async init({ catalog, config, scheduler }) {
        const provider = new AzureBlobEntityProvider(
          config.getString('techdocs.publisher.azureBlobStorage.credentials.accountName'),
          config.getString('techdocs.publisher.azureBlobStorage.credentials.accountKey'),
          config.getString('techdocs.publisher.azureBlobStorage.containerName'),
        );
        catalog.addEntityProvider(provider);
        await scheduler.scheduleTask({
          id: 'azure-blob-synced-data-refresh',
          frequency: { minutes: 5 },
          timeout: { minutes: 2 },
          fn: () => provider.refresh(),
        });
      },
    });
  },
});