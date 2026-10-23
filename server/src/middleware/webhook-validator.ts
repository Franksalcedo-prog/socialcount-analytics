import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

/**
 * Valida la firma criptográfica x-hub-signature-256 enviada por los webhooks de Meta
 */
export function validateMetaWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  // Si estamos en modo desarrollo y no se ha configurado META_APP_SECRET, permitir para testing
  if (config.nodeEnv === 'development' && (!config.meta.appSecret || config.meta.appSecret === 'your_meta_app_secret')) {
    return next();
  }

  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) {
    res.status(401).json({ error: 'Firma x-hub-signature-256 requerida.' });
    return;
  }

  const parts = signature.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    res.status(401).json({ error: 'Formato de firma inválido (se espera sha256=...).' });
    return;
  }

  const expectedSignatureHex = parts[1];
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  const hmac = crypto.createHmac('sha256', config.meta.appSecret);
  const calculatedHex = hmac.update(rawBody).digest('hex');

  const expectedBuf = Buffer.from(expectedSignatureHex, 'hex');
  const calculatedBuf = Buffer.from(calculatedHex, 'hex');

  if (expectedBuf.length !== calculatedBuf.length || !crypto.timingSafeEqual(expectedBuf, calculatedBuf)) {
    res.status(403).json({ error: 'Firma HMAC de Meta no coincide o ha sido alterada.' });
    return;
  }

  next();
}
