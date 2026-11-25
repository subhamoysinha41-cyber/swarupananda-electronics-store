import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';

export class AzuriteBlobStorageProvider {
  constructor({ connectionString = '' } = {}) {
    this.connectionString = connectionString;
  }

  isConfigured() {
    return Boolean(this.connectionString);
  }

  async healthCheck() {
    return this.isConfigured();
  }

  async upload(containerName, name, data, contentType = 'application/octet-stream') {
    const client = this.getClient();
    const container = client.getContainerClient(containerName);
    await container.createIfNotExists();
    const blob = container.getBlockBlobClient(name);
    await blob.uploadData(data, { blobHTTPHeaders: { blobContentType: contentType } });
    return blob.url;
  }

  getClient() {
    if (!this.connectionString) throw new Error('Azurite Blob connection string is not configured');
    return BlobServiceClient.fromConnectionString(this.connectionString);
  }
}

export class AzureBlobStorageProvider {
  constructor({ account = '', credentialFactory = () => new DefaultAzureCredential() } = {}) {
    this.account = account;
    this.credentialFactory = credentialFactory;
  }

  isConfigured() {
    return Boolean(this.account);
  }

  async healthCheck() {
    return this.isConfigured();
  }

  async upload(containerName, name, data, contentType = 'application/octet-stream') {
    const client = this.getClient();
    const container = client.getContainerClient(containerName);
    await container.createIfNotExists();
    const blob = container.getBlockBlobClient(name);
    await blob.uploadData(data, { blobHTTPHeaders: { blobContentType: contentType } });
    return blob.url;
  }

  getClient() {
    if (!this.account) throw new Error('Azure Storage account is not configured');
    return new BlobServiceClient(
      `https://${this.account}.blob.core.windows.net`,
      this.credentialFactory(),
    );
  }
}

export function createBlobStorageProvider(config) {
  if (config.azureEnvironment === 'Development') {
    return new AzuriteBlobStorageProvider({
      connectionString: config.azuriteConnectionString,
    });
  }
  return new AzureBlobStorageProvider({ account: config.azureStorageAccount });
}
