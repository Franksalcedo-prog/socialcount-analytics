import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { PaginationQuerySchema } from '../schemas/index.js';

export const commentsRouter = Router();

/**
 * GET /api/comments
 * Tabla paginada en servidor de comentarios con filtros completos
 */
commentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const validated = PaginationQuerySchema.parse(req.query);
    const { page, pageSize, search, platform, accountId, postId, startDate, endDate, sortOrder } = validated;

    const where: any = {};

    if (platform && platform !== 'ALL') {
      where.platform = platform;
    }

    if (accountId) {
      where.socialAccountId = accountId;
    }

    if (postId) {
      where.postId = postId;
    }

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

    const totalCount = await prisma.socialComment.count({ where });
    const comments = await prisma.socialComment.findMany({
      where,
      orderBy: { commentDate: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        socialAccount: {
          select: {
            name: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            message: true,
            permalink: true,
            mediaUrl: true,
          },
        },
      },
    });

    res.json({
      data: comments.map((c) => ({
        id: c.id,
        platform: c.platform,
        externalId: c.externalId,
        parentCommentId: c.parentCommentId,
        authorName: c.authorName || 'Usuario de Meta',
        authorExternalId: c.authorExternalId,
        text: c.text,
        commentDate: c.commentDate,
        isReply: c.isReply,
        replyCount: c.replyCount,
        status: c.status,
        capturedAt: c.capturedAt,
        accountName: c.socialAccount?.name || 'Cuenta',
        post: {
          id: c.post.id,
          message: c.post.message,
          permalink: c.post.permalink,
          mediaUrl: c.post.mediaUrl,
        },
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
