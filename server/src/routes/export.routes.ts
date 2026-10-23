import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { PaginationQuerySchema } from '../schemas/index.js';
import { generateCommentsCsv, CsvCommentRow } from '../services/csv-export.service.js';

export const exportRouter = Router();

/**
 * GET /api/export/comments/csv
 * Exporta comentarios filtrados a formato CSV compatible con Excel
 */
exportRouter.get('/comments/csv', async (req: Request, res: Response) => {
  try {
    const validated = PaginationQuerySchema.parse(req.query);
    const { platform, accountId, postId, startDate, endDate, search } = validated;

    const where: any = {};

    if (platform && platform !== 'ALL') where.platform = platform;
    if (accountId) where.socialAccountId = accountId;
    if (postId) where.postId = postId;
    if (search && search.trim() !== '') {
      where.OR = [
        { text: { contains: search.trim() } },
        { authorName: { contains: search.trim() } },
      ];
    }
    if (startDate || endDate) {
      where.commentDate = {};
      if (startDate) where.commentDate.gte = new Date(startDate);
      if (endDate) where.commentDate.lte = new Date(endDate);
    }

    const comments = await prisma.socialComment.findMany({
      where,
      orderBy: { commentDate: 'desc' },
      take: 2000, // Límite razonable por descarga directa
      include: {
        socialAccount: { select: { name: true } },
        post: { select: { id: true } },
      },
    });

    const rows: CsvCommentRow[] = comments.map((c) => ({
      platform: c.platform,
      accountName: c.socialAccount?.name || 'N/A',
      postId: c.post.id,
      externalCommentId: c.externalId,
      authorName: c.authorName || 'Usuario Anónimo',
      text: c.text,
      commentDate: c.commentDate.toISOString(),
      isReply: c.isReply ? 'Sí' : 'No',
      status: c.status,
    }));

    const csvContent = generateCommentsCsv(rows);
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="socialcount_comentarios_${dateStr}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al exportar CSV: ' + error.message });
  }
});
