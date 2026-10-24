import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiRateLimiter } from './middleware/rate-limiter.js';
import { oauthRouter } from './routes/oauth.routes.js';
import { accountsRouter } from './routes/accounts.routes.js';
import { analyticsRouter } from './routes/analytics.routes.js';
import { postsRouter } from './routes/posts.routes.js';
import { commentsRouter } from './routes/comments.routes.js';
import { syncRouter } from './routes/sync.routes.js';
import { webhooksRouter } from './routes/webhooks.routes.js';
import { exportRouter } from './routes/export.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { votingRouter } from './routes/voting.routes.js';
import { seedDemoDataIfNeeded } from './services/demo-data.service.js';
import { seedEbanoVotingDataIfNeeded } from './services/ebano-voting-seed.service.js';

const app = express();

// Seguridad HTTP con Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS adaptativo para frontend local y producción en Vercel
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.vercel.app') || origin === config.clientOrigin) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Capturar rawBody para validación de firma criptográfica de Webhooks de Meta
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Rate Limiting para la API
app.use('/api', apiRateLimiter);

// Healthcheck de infraestructura
const healthResponse = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    app: 'SocialCount Analytics API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
};
app.get('/health', healthResponse);
app.get('/api/health', healthResponse);

// Rutas de la API
app.use('/api/oauth', oauthRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/export', exportRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/voting', votingRouter);

// Manejador centralizado de errores
app.use(errorHandler);

// Iniciar servidor (solo en entornos tradicionales con puerto, omitido en Vercel Serverless)
if (!process.env.VERCEL) {
  const port = config.port;
  const server = app.listen(port, async () => {
    console.log(`🚀 Servidor SocialCount Analytics ejecutándose en http://localhost:${port}`);
    console.log(`📡 Entorno: ${config.nodeEnv} | Modo Demo: ${config.demoModeDefault ? 'ACTIVO' : 'INACTIVO'}`);

    try {
      const seedResult = await seedDemoDataIfNeeded();
      if (seedResult.seeded) {
        console.log(`🌱 ${seedResult.message}`);
      }
      const votingResult = await seedEbanoVotingDataIfNeeded();
      if (votingResult.seeded) {
        console.log(`👑 ${votingResult.message}`);
      }
    } catch (seedErr: any) {
      console.warn('[Seed Check]:', seedErr.message);
    }
  });

  process.on('SIGTERM', () => {
    console.log('Cerrando servidor...');
    server.close(() => {
      console.log('Servidor finalizado.');
    });
  });
}

export default app;
