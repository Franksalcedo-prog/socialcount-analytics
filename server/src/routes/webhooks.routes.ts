import { Router, Request, Response } from 'express';
import { config } from '../config/env.js';
import { validateMetaWebhookSignature } from '../middleware/webhook-validator.js';
import { syncService } from '../services/sync.service.js';

export const webhooksRouter = Router();

/**
 * GET /api/webhooks/meta
 * Verificación oficial del Webhook por parte de Meta Graph API
 */
webhooksRouter.get('/meta', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.meta.webhookVerifyToken) {
    console.log('[Meta Webhook Verified]: Suscripción confirmada exitosamente.');
    res.status(200).send(challenge);
  } else {
    console.warn('[Meta Webhook Verification Failed]: Token o modo inválido.');
    res.sendStatus(403);
  }
});

/**
 * POST /api/webhooks/meta
 * Recepción de eventos en tiempo real de Facebook e Instagram (nuevos comentarios, cambios)
 */
webhooksRouter.post('/meta', validateMetaWebhookSignature, async (req: Request, res: Response) => {
  const body = req.body;

  // Responder inmediatamente 200 OK a Meta para cumplir con el SLA de respuesta (<20s)
  res.status(200).send('EVENT_RECEIVED');

  try {
    if (body.object === 'page' || body.object === 'instagram') {
      console.log(`[Meta Webhook Event Received]: Objeto ${body.object}, ${body.entry?.length || 0} entradas.`);

      // Procesar en segundo plano para no bloquear el hilo de respuesta
      setImmediate(async () => {
        try {
          await syncService.executeSync(undefined, 'WEBHOOK');
        } catch (e: any) {
          console.error('[Webhook Background Sync Error]:', e.message);
        }
      });
    }
  } catch (error: any) {
    console.error('[Meta Webhook Processing Error]:', error.message);
  }
});
