import { prisma } from '../db/prisma.js';
import { metaApiService, MetaPostItem, MetaCommentItem } from './meta-api.service.js';

export interface SyncProgressCallback {
  (step: string, processed: number, total: number, message: string): void;
}

export class SyncService {
  /**
   * Ejecuta el trabajo de sincronización para una cuenta específica o para todas las cuentas activas
   */
  public async executeSync(
    accountId?: string,
    triggerSource: 'MANUAL' | 'SCHEDULED' | 'WEBHOOK' = 'MANUAL',
    progressCallback?: SyncProgressCallback
  ): Promise<{
    jobId: string;
    status: string;
    postsProcessed: number;
    commentsAdded: number;
    commentsUpdated: number;
    durationMs: number;
  }> {
    const startTime = Date.now();

    // 1. Crear registro del SyncJob en la base de datos
    const syncJob = await prisma.syncJob.create({
      data: {
        socialAccountId: accountId || null,
        triggerSource,
        status: 'IN_PROGRESS',
        startedAt: new Date(startTime),
        postsProcessed: 0,
        commentsFetched: 0,
        commentsAdded: 0,
        commentsUpdated: 0,
      },
    });

    await this.log(syncJob.id, 'INFO', `Iniciando proceso de sincronización [ID: ${syncJob.id} | Origen: ${triggerSource}]`);

    let totalPostsProcessed = 0;
    let totalCommentsFetched = 0;
    let totalCommentsAdded = 0;
    let totalCommentsUpdated = 0;
    let errorSummary: string | null = null;
    let finalStatus: 'COMPLETED' | 'PARTIAL' | 'FAILED' = 'COMPLETED';

    try {
      // 2. Obtener cuentas a sincronizar
      const whereClause = accountId
        ? { id: accountId, isMonitored: true }
        : { isMonitored: true, tokenStatus: 'ACTIVE' };

      const accounts = await prisma.socialAccount.findMany({
        where: whereClause,
      });

      if (accounts.length === 0) {
        await this.log(syncJob.id, 'WARN', 'No se encontraron cuentas activas monitoreadas para sincronizar.');
        await prisma.syncJob.update({
          where: { id: syncJob.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            durationMs: Date.now() - startTime,
          },
        });
        return {
          jobId: syncJob.id,
          status: 'COMPLETED',
          postsProcessed: 0,
          commentsAdded: 0,
          commentsUpdated: 0,
          durationMs: Date.now() - startTime,
        };
      }

      progressCallback?.('ACCOUNTS_LOADED', 0, accounts.length, `Sincronizando ${accounts.length} cuentas...`);

      // 3. Procesar cada cuenta
      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        await this.log(
          syncJob.id,
          'INFO',
          `Procesando cuenta [${account.platform}] ${account.name} (ID externo: ${account.externalId})`
        );

        try {
          // Si es cuenta de demostración, saltar llamada real o actualizar timestamp
          if (account.externalId.startsWith('demo_')) {
            await this.syncDemoAccount(account.id, syncJob.id);
            totalPostsProcessed += 3;
            totalCommentsFetched += 15;
            totalCommentsUpdated += 2;
            continue;
          }

          // A) Recuperar publicaciones desde Meta
          let posts: MetaPostItem[] = [];
          if (account.platform === 'FACEBOOK') {
            posts = await metaApiService.getFacebookPagePosts(account.externalId, account.encryptedAccessToken);
          } else if (account.platform === 'INSTAGRAM') {
            posts = await metaApiService.getInstagramMedia(account.externalId, account.encryptedAccessToken);
          }

          // B) Procesar y almacenar posts
          for (const postData of posts) {
            totalPostsProcessed++;

            // Upsert post en la base de datos
            const postRecord = await prisma.socialPost.upsert({
              where: {
                platform_externalId: {
                  platform: postData.platform,
                  externalId: postData.id,
                },
              },
              create: {
                socialAccountId: account.id,
                platform: postData.platform,
                externalId: postData.id,
                message: postData.message,
                mediaType: postData.mediaType,
                mediaUrl: postData.mediaUrl,
                permalink: postData.permalink,
                publishedAt: postData.publishedAt,
                apiCommentsCount: postData.apiCommentsCount,
                lastSyncAt: new Date(),
              },
              update: {
                message: postData.message,
                mediaType: postData.mediaType,
                mediaUrl: postData.mediaUrl,
                permalink: postData.permalink,
                apiCommentsCount: postData.apiCommentsCount,
                lastSyncAt: new Date(),
              },
            });

            // C) Recuperar comentarios para el post
            let rawComments: MetaCommentItem[] = [];
            if (postData.platform === 'FACEBOOK') {
              rawComments = await metaApiService.getFacebookComments(postData.id, account.encryptedAccessToken);
            } else {
              rawComments = await metaApiService.getInstagramComments(postData.id, account.encryptedAccessToken);
            }

            totalCommentsFetched += rawComments.length;

            // D) Guardar comentarios de manera idempotente
            const stats = await this.saveCommentsIdempotently(
              postRecord.id,
              account.id,
              postData.platform,
              rawComments
            );

            totalCommentsAdded += stats.added;
            totalCommentsUpdated += stats.updated;

            // Actualizar contadores acumulados en el post
            const currentStoredCount = await prisma.socialComment.count({
              where: { postId: postRecord.id },
            });
            const repliesCount = await prisma.socialComment.count({
              where: { postId: postRecord.id, isReply: true },
            });

            await prisma.socialPost.update({
              where: { id: postRecord.id },
              data: {
                totalStoredComments: currentStoredCount,
                repliesCount: repliesCount,
              },
            });
          }

          // Actualizar lastSyncAt en la cuenta
          await prisma.socialAccount.update({
            where: { id: account.id },
            data: { lastSyncAt: new Date() },
          });

          progressCallback?.(
            'ACCOUNT_SYNCED',
            i + 1,
            accounts.length,
            `Cuenta ${account.name} sincronizada exitosamente.`
          );
        } catch (accountError: any) {
          finalStatus = 'PARTIAL';
          const errMsg = `Error al sincronizar cuenta ${account.name}: ${accountError?.message || accountError}`;
          await this.log(syncJob.id, 'ERROR', errMsg);
          errorSummary = errorSummary ? `${errorSummary}; ${errMsg}` : errMsg;
        }
      }
    } catch (globalError: any) {
      finalStatus = 'FAILED';
      errorSummary = `Fallo crítico de sincronización: ${globalError?.message || globalError}`;
      await this.log(syncJob.id, 'ERROR', errorSummary);
    } finally {
      const durationMs = Date.now() - startTime;
      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          durationMs,
          postsProcessed: totalPostsProcessed,
          commentsFetched: totalCommentsFetched,
          commentsAdded: totalCommentsAdded,
          commentsUpdated: totalCommentsUpdated,
          errorSummary,
        },
      });

      await this.log(
        syncJob.id,
        'INFO',
        `Sincronización finalizada con estado ${finalStatus}. Agregados: ${totalCommentsAdded}, Actualizados: ${totalCommentsUpdated}, Duración: ${durationMs}ms.`
      );
    }

    return {
      jobId: syncJob.id,
      status: finalStatus,
      postsProcessed: totalPostsProcessed,
      commentsAdded: totalCommentsAdded,
      commentsUpdated: totalCommentsUpdated,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Guarda o actualiza comentarios asegurando idempotencia y no duplicación
   */
  private async saveCommentsIdempotently(
    postId: string,
    socialAccountId: string,
    platform: 'FACEBOOK' | 'INSTAGRAM',
    comments: MetaCommentItem[]
  ): Promise<{ added: number; updated: number }> {
    let added = 0;
    let updated = 0;

    for (const c of comments) {
      // 1. Guardar comentario principal
      const existing = await prisma.socialComment.findUnique({
        where: {
          platform_externalId: {
            platform,
            externalId: c.id,
          },
        },
      });

      if (!existing) {
        await prisma.socialComment.create({
          data: {
            postId,
            socialAccountId,
            platform,
            externalId: c.id,
            parentCommentId: c.parentCommentId || null,
            authorName: c.authorName,
            authorExternalId: c.authorExternalId,
            text: c.text,
            commentDate: c.commentDate,
            isReply: c.isReply,
            replyCount: c.replies?.length || 0,
            status: 'VERIFIED',
          },
        });
        added++;
      } else {
        // Actualizar si cambió texto o recuento de respuestas
        await prisma.socialComment.update({
          where: { id: existing.id },
          data: {
            text: c.text,
            replyCount: c.replies?.length || existing.replyCount,
            status: 'VERIFIED',
            updatedAt: new Date(),
          },
        });
        updated++;
      }

      // 2. Procesar respuestas anidadas recursivamente si existen
      if (c.replies && c.replies.length > 0) {
        const replyStats = await this.saveCommentsIdempotently(
          postId,
          socialAccountId,
          platform,
          c.replies
        );
        added += replyStats.added;
        updated += replyStats.updated;
      }
    }

    return { added, updated };
  }

  /**
   * Simula actualización controlada para cuentas en modo demostración
   */
  private async syncDemoAccount(accountId: string, syncJobId: string): Promise<void> {
    await prisma.socialAccount.update({
      where: { id: accountId },
      data: { lastSyncAt: new Date() },
    });
    await this.log(syncJobId, 'INFO', `Cuenta DEMO sincronizada exitosamente con datos locales de prueba.`);
  }

  /**
   * Escribe un log persistente vinculado al SyncJob
   */
  private async log(syncJobId: string, level: 'INFO' | 'WARN' | 'ERROR', message: string, metadata?: any): Promise<void> {
    try {
      await prisma.syncLog.create({
        data: {
          syncJobId,
          level,
          message,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (e) {
      console.error('[SyncLog Error]', e);
    }
  }
}

export const syncService = new SyncService();
