import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { UpdateAccountSettingsSchema } from '../schemas/index.js';
import { seedDemoDataIfNeeded } from '../services/demo-data.service.js';

export const accountsRouter = Router();

/**
 * GET /api/accounts
 * Lista todas las cuentas sociales conectadas con estadísticas agregadas
 */
accountsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.socialAccount.findMany({
      orderBy: [{ platform: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    });

    const sanitizedAccounts = accounts.map((acc) => {
      let parsedPerms: string[] = [];
      try {
        parsedPerms = JSON.parse(acc.permissions);
      } catch {
        parsedPerms = [];
      }

      return {
        id: acc.id,
        platform: acc.platform,
        externalId: acc.externalId,
        name: acc.name,
        username: acc.username,
        profilePictureUrl: acc.profilePictureUrl,
        tokenStatus: acc.tokenStatus,
        tokenExpiresAt: acc.tokenExpiresAt,
        isMonitored: acc.isMonitored,
        lastSyncAt: acc.lastSyncAt,
        createdAt: acc.createdAt,
        permissions: parsedPerms,
        postsCount: acc._count.posts,
        commentsCount: acc._count.comments,
        isDemo: acc.externalId.startsWith('demo_'),
      };
    });

    res.json(sanitizedAccounts);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar cuentas: ' + error.message });
  }
});

/**
 * GET /api/accounts/:id
 */
accountsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const account = await prisma.socialAccount.findUnique({
      where: { id },
    });

    if (!account) {
      res.status(404).json({ error: 'Cuenta no encontrada.' });
      return;
    }

    const [postsCount, commentsCount] = await Promise.all([
      prisma.socialPost.count({ where: { socialAccountId: id } }),
      prisma.socialComment.count({ where: { socialAccountId: id } }),
    ]);

    res.json({
      id: account.id,
      platform: account.platform,
      externalId: account.externalId,
      name: account.name,
      username: account.username,
      profilePictureUrl: account.profilePictureUrl,
      tokenStatus: account.tokenStatus,
      tokenExpiresAt: account.tokenExpiresAt,
      isMonitored: account.isMonitored,
      lastSyncAt: account.lastSyncAt,
      createdAt: account.createdAt,
      postsCount,
      commentsCount,
      isDemo: account.externalId.startsWith('demo_'),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/accounts/:id
 * Activa o desactiva el monitoreo de una cuenta
 */
accountsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validated = UpdateAccountSettingsSchema.parse(req.body);

    const updated = await prisma.socialAccount.update({
      where: { id },
      data: {
        ...(validated.isMonitored !== undefined ? { isMonitored: validated.isMonitored } : {}),
      },
    });

    res.json({
      id: updated.id,
      isMonitored: updated.isMonitored,
      message: 'Configuración de cuenta actualizada.',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/accounts/:id
 * Desconecta la cuenta y elimina credenciales asociadas
 */
accountsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const account = await prisma.socialAccount.findUnique({
      where: { id },
    });

    if (!account) {
      res.status(404).json({ error: 'Cuenta no encontrada.' });
      return;
    }

    await prisma.socialAccount.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        action: 'ACCOUNT_DISCONNECTED',
        details: `Cuenta [${account.platform}] ${account.name} desconectada.`,
        ipAddress: req.ip,
      },
    });

    res.json({ success: true, message: 'Cuenta desconectada exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/accounts/reset-demo
 * Restaura las cuentas y datos de demostración
 */
accountsRouter.post('/reset-demo', async (_req: Request, res: Response) => {
  try {
    const demoAccounts = await prisma.socialAccount.findMany({
      where: { externalId: { startsWith: 'demo_' } },
    });

    for (const acc of demoAccounts) {
      await prisma.socialAccount.delete({ where: { id: acc.id } });
    }

    const result = await seedDemoDataIfNeeded();
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al reiniciar datos demo: ' + error.message });
  }
});
