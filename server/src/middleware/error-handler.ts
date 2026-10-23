import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Manejar errores de validación de Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Error de validación en los parámetros enviados.',
      details: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
    return;
  }

  // Manejar errores generales sin filtrar credenciales
  console.error('[Unhandled Server Error]:', err.message);
  res.status(500).json({
    error: 'Ocurrió un error interno en el servidor.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
