import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Si estamos en modo desarrollo o demo, permitir continuar con usuario por defecto
    if (config.nodeEnv === 'development' || config.demoModeDefault) {
      req.user = {
        id: 'demo-user-id-001',
        email: 'demo@socialcount.io',
        role: 'ADMIN',
      };
      return next();
    }

    res.status(401).json({ error: 'Token de autorización requerido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}
