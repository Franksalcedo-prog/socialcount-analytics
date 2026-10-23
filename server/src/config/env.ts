import dotenv from 'dotenv';
import path from 'node:path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  encryptionMasterKey: process.env.ENCRYPTION_MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-socialcount-change-in-production-123456789',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  meta: {
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
    apiVersion: process.env.META_API_VERSION || 'v21.0',
    redirectUri: process.env.META_REDIRECT_URI || 'http://localhost:5000/api/oauth/meta/callback',
    webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'socialcount_webhook_secret_verify_token_2026',
  },
  demoModeDefault: process.env.DEMO_MODE_DEFAULT === 'true',
};
