import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { config } from '../config/env.js';
import { metaApiService } from '../services/meta-api.service.js';
import { encryptToken } from '../services/encryption.service.js';
import { prisma } from '../db/prisma.js';

export const oauthRouter = Router();

// Cache temporal en memoria de states para validación CSRF (10 minutos)
const stateStore = new Map<string, number>();

/**
 * GET /api/oauth/meta/connect
 * Genera la URL de conexión OAuth con state criptográfico
 */
oauthRouter.get('/meta/connect', (req: Request, res: Response) => {
  if (!config.meta.appId || !config.meta.appSecret) {
    res.status(400).json({
      error: 'Meta App ID y Secret no están configurados en el servidor.',
      needsConfig: true,
    });
    return;
  }

  // Generar nonce criptográfico de 32 bytes
  const state = crypto.randomBytes(16).toString('hex');
  stateStore.set(state, Date.now() + 10 * 60 * 1000); // 10 min de vida

  const authUrl = metaApiService.getAuthorizationUrl(state);
  res.json({ authUrl, state });
});

/**
 * GET /api/oauth/meta/callback
 * Recibe el callback de Meta tras la autorización del usuario
 */
oauthRouter.get('/meta/callback', async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('[Meta OAuth Error Callback]:', error, error_description);
    res.redirect(`${config.clientOrigin}/accounts?error=${encodeURIComponent(String(error_description || error))}`);
    return;
  }

  if (!state || !stateStore.has(String(state))) {
    res.redirect(`${config.clientOrigin}/accounts?error=${encodeURIComponent('Parámetro state inválido o expirado (posible CSRF).')}`);
    return;
  }
  stateStore.delete(String(state));

  if (!code) {
    res.redirect(`${config.clientOrigin}/accounts?error=${encodeURIComponent('Código de autorización no recibido.')}`);
    return;
  }

  try {
    // 1. Intercambiar code por Short-lived User Token
    const { accessToken: shortLivedToken } = await metaApiService.exchangeCodeForToken(String(code));

    // 2. Intercambiar por Long-lived User Token (~60 días)
    const { accessToken: longLivedToken, expiresIn } = await metaApiService.getLongLivedUserToken(shortLivedToken);

    // 3. Consultar Páginas y cuentas de Instagram vinculadas
    const pages = await metaApiService.getManagedPagesAndInstagram(longLivedToken);

    // 4. Obtener o crear usuario por defecto
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@socialcount.io',
          name: 'Administrador Principal',
          passwordHash: '$2a$10$defaultAdminHashPlaceholder1234567890abcdef',
          role: 'ADMIN',
        },
      });
    }

    // 5. Guardar o actualizar Páginas de Facebook
    for (const page of pages) {
      // Guardar Página FB
      await prisma.socialAccount.upsert({
        where: {
          platform_externalId: {
            platform: 'FACEBOOK',
            externalId: page.id,
          },
        },
        create: {
          userId: user.id,
          platform: 'FACEBOOK',
          externalId: page.id,
          name: page.name,
          username: null,
          profilePictureUrl: page.pictureUrl,
          encryptedAccessToken: encryptToken(page.accessToken),
          tokenExpiresAt: null, // Page tokens are permanent
          tokenStatus: 'ACTIVE',
          permissions: JSON.stringify(page.tasks || []),
          isMonitored: true,
        },
        update: {
          name: page.name,
          profilePictureUrl: page.pictureUrl,
          encryptedAccessToken: encryptToken(page.accessToken),
          tokenStatus: 'ACTIVE',
          permissions: JSON.stringify(page.tasks || []),
        },
      });

      // Guardar Instagram Business Account si existe
      if (page.instagramBusinessAccount) {
        const ig = page.instagramBusinessAccount;
        await prisma.socialAccount.upsert({
          where: {
            platform_externalId: {
              platform: 'INSTAGRAM',
              externalId: ig.id,
            },
          },
          create: {
            userId: user.id,
            platform: 'INSTAGRAM',
            externalId: ig.id,
            name: ig.name || ig.username,
            username: ig.username,
            profilePictureUrl: ig.profilePictureUrl,
            encryptedAccessToken: encryptToken(page.accessToken), // Usa el page token con permisos IG
            tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
            tokenStatus: 'ACTIVE',
            permissions: JSON.stringify(['instagram_basic', 'instagram_manage_comments']),
            isMonitored: true,
          },
          update: {
            name: ig.name || ig.username,
            username: ig.username,
            profilePictureUrl: ig.profilePictureUrl,
            encryptedAccessToken: encryptToken(page.accessToken),
            tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
            tokenStatus: 'ACTIVE',
          },
        });
      }
    }

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ACCOUNT_CONNECTED',
        details: `Conexión OAuth exitosa con Meta: ${pages.length} páginas sincronizadas.`,
        ipAddress: req.ip,
      },
    });

    res.redirect(`${config.clientOrigin}/accounts?connected=true&count=${pages.length}`);
  } catch (error: any) {
    console.error('[OAuth Callback Exception]:', error.message);
    res.redirect(`${config.clientOrigin}/accounts?error=${encodeURIComponent('Error durante el intercambio de credenciales con Meta: ' + error.message)}`);
  }
});

/**
 * GET /api/oauth/status
 * Devuelve el estado de configuración de las credenciales de Meta
 */
oauthRouter.get('/status', (_req: Request, res: Response) => {
  const isConfigured = Boolean(
    config.meta.appId &&
    config.meta.appId !== 'your_meta_app_id' &&
    config.meta.appSecret &&
    config.meta.appSecret !== 'your_meta_app_secret'
  );

  res.json({
    isConfigured,
    appIdConfigured: Boolean(config.meta.appId && config.meta.appId !== 'your_meta_app_id'),
    appId: isConfigured ? `${config.meta.appId.substring(0, 4)}...${config.meta.appId.slice(-4)}` : null,
    apiVersion: config.meta.apiVersion,
    redirectUri: config.meta.redirectUri,
    demoMode: !isConfigured || config.demoModeDefault,
  });
});
