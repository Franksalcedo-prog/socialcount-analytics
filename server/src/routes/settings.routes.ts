import { Router, Request, Response } from 'express';
import { config } from '../config/env.js';
import { prisma } from '../db/prisma.js';

export const settingsRouter = Router();

/**
 * GET /api/settings/info
 * Información técnica del sistema sin credenciales sensibles
 */
settingsRouter.get('/info', async (_req: Request, res: Response) => {
  try {
    let dbStatus = 'CONNECTED';
    let accountsCount = 0;
    let postsCount = 0;
    let commentsCount = 0;

    try {
      [accountsCount, postsCount, commentsCount] = await Promise.all([
        prisma.socialAccount.count(),
        prisma.socialPost.count(),
        prisma.socialComment.count(),
      ]);
    } catch {
      dbStatus = 'DISCONNECTED';
    }

    const isMetaConfigured = Boolean(
      config.meta.appId &&
      config.meta.appId !== 'your_meta_app_id' &&
      config.meta.appSecret &&
      config.meta.appSecret !== 'your_meta_app_secret'
    );

    res.json({
      environment: config.nodeEnv,
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        provider: config.databaseUrl.startsWith('file:') ? 'SQLite' : 'PostgreSQL',
        status: dbStatus,
        accountsCount,
        postsCount,
        commentsCount,
      },
      meta: {
        isConfigured: isMetaConfigured,
        apiVersion: config.meta.apiVersion,
        appId: isMetaConfigured ? `${config.meta.appId.substring(0, 4)}...${config.meta.appId.slice(-4)}` : 'No configurado',
        redirectUri: config.meta.redirectUri,
        webhookEndpoint: `${config.clientOrigin.replace('5173', '5000')}/api/webhooks/meta`,
        webhookVerifyToken: config.meta.webhookVerifyToken,
      },
      demoModeActive: !isMetaConfigured || config.demoModeDefault,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
