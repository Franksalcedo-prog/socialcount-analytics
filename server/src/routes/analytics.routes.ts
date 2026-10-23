import { Router, Request, Response } from 'express';
import { AnalyticsQuerySchema } from '../schemas/index.js';
import { analyticsService } from '../services/analytics.service.js';

export const analyticsRouter = Router();

/**
 * GET /api/analytics/dashboard
 * Retorna las métricas consolidadas del panel de control
 */
analyticsRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const validated = AnalyticsQuerySchema.parse(req.query);

    const metrics = await analyticsService.getDashboardMetrics({
      platform: validated.platform as any,
      accountId: validated.accountId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      includeReplies: validated.includeReplies === 'true',
    });

    res.json(metrics);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
