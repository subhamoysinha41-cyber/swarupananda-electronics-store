import { describe, expect, it, jest } from '@jest/globals';
import {
  AzureBlobStorageProvider,
  AzuriteBlobStorageProvider,
  createBlobStorageProvider,
} from '../src/services/blob-storage-provider.js';

describe('optional Azure Blob provider', () => {
  it('selects Azurite only for the explicit Development environment and tolerates missing settings', async () => {
    const development = createBlobStorageProvider({
      azureEnvironment: 'Development',
      azuriteConnectionString: '',
    });

    expect(development).toBeInstanceOf(AzuriteBlobStorageProvider);
    await expect(development.healthCheck()).resolves.toBe(false);
    expect(() => development.getClient()).toThrow('Azurite Blob connection string is not configured');
  });

  it.each([undefined, '', 'development', 'Production', 'Staging'])(
    'selects Azure credentials when the environment is %s',
    async (azureEnvironment) => {
      const credentialFactory = jest.fn();
      const provider = new AzureBlobStorageProvider({
        account: '',
        credentialFactory,
      });
      const selected = createBlobStorageProvider({
        azureEnvironment,
        azureStorageAccount: '',
      });

      expect(selected).toBeInstanceOf(AzureBlobStorageProvider);
      await expect(provider.healthCheck()).resolves.toBe(false);
      expect(() => provider.getClient()).toThrow('Azure Storage account is not configured');
      expect(credentialFactory).not.toHaveBeenCalled();
    },
  );
});
