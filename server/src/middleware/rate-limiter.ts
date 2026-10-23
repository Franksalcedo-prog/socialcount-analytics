import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // Límite por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Límite de solicitudes alcanzado. Por favor, intenta de nuevo en unos minutos.',
  },
});

export const syncRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // Máximo 10 disparos de sincronización por minuto
  message: {
    error: 'Sincronización en curso o límite de disparos por minuto alcanzado.',
  },
});
