import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { syncService } from '../services/sync.service.js';
import { syncRateLimiter } from '../middleware/rate-limiter.js';
import { TriggerSyncSchema } from '../schemas/index.js';

export const syncRouter = Router();

/**
 * POST /api/sync/trigger
 * Dispara un trabajo de sincronización asíncrono o síncrono
 */
syncRouter.post('/trigger', syncRateLimiter, async (req: Request, res: Response) => {
  try {
    const validated = TriggerSyncSchema.parse(req.body);

    // Verificar si ya hay un trabajo en progreso
    const runningJob = await prisma.syncJob.findFirst({
      where: { status: 'IN_PROGRESS' },
    });

    if (runningJob) {
      res.status(409).json({
        error: 'Ya existe un proceso de sincronización en curso.',
        jobId: runningJob.id,
        startedAt: runningJob.startedAt,
      });
      return;
    }

    // Ejecutar sincronización
    const result = await syncService.executeSync(validated.accountId, 'MANUAL');

    res.json({
      success: true,
      jobId: result.jobId,
      status: result.status,
      postsProcessed: result.postsProcessed,
      commentsAdded: result.commentsAdded,
      commentsUpdated: result.commentsUpdated,
      durationMs: result.durationMs,
      message: 'Sincronización finalizada.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sync/history
 * Obtiene el historial de trabajos de sincronización y sus métricas
 */
syncRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 100);

    const jobs = await prisma.syncJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        socialAccount: {
          select: { name: true, platform: true },
        },
        logs: {
          orderBy: { timestamp: 'asc' },
          take: 20,
        },
      },
    });

    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sync/active
 * Verifica si hay algún job activo en este momento
 */
syncRouter.get('/active', async (_req: Request, res: Response) => {
  try {
    const activeJob = await prisma.syncJob.findFirst({
      where: { status: 'IN_PROGRESS' },
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 3,
        },
      },
    });

    res.json({
      hasActiveJob: Boolean(activeJob),
      job: activeJob || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
