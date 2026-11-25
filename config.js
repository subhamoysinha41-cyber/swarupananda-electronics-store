import 'dotenv/config';

function shortJwtLifetime(value) {
  const match = String(value || '').match(/^(\d+)(s|m|h)$/);
  if (!match) return '15m';
  const amount = Number(match[1]);
  const seconds = amount * ({ s: 1, m: 60, h: 3600 }[match[2]]);
  return seconds > 0 && seconds <= 3600 ? value : '15m';
}

export function getConfig(env = process.env) {
  return Object.freeze({
    environment: env.NODE_ENV || 'production',
    azureEnvironment: env.AZURE_FUNCTIONS_ENVIRONMENT || 'Production',
    databaseUrl: env.DATABASE_URL || (
      env.NODE_ENV === 'development' ? 'mongodb://localhost:27017/mobile-store' : ''
    ),
    jwtSecret: env.JWT_SECRET || '',
    jwtIssuer: env.JWT_ISSUER || 'mobile-store-api',
    jwtAudience: env.JWT_AUDIENCE || 'mobile-store-web',
    jwtExpiresIn: shortJwtLifetime(env.JWT_EXPIRES_IN),
    port: Number(env.PORT) || 3001,
    corsOrigins: (env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    cloudinary: {
      cloudName: env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: env.CLOUDINARY_API_KEY || '',
      apiSecret: env.CLOUDINARY_API_SECRET || '',
    },
    razorpay: {
      keyId: env.RAZORPAY_KEY_ID || '',
      keySecret: env.RAZORPAY_KEY_SECRET || '',
    },
    azureStorageAccount: env.AZURE_STORAGE_ACCOUNT || '',
    azureStorageContainer: env.AZURE_STORAGE_CONTAINER || 'mobile-store',
    azuriteConnectionString: env.AZURITE_BLOB_CONNECTION_STRING || '',
  });
}

export const config = getConfig();
