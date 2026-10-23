import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { PaginationQuerySchema } from '../schemas/index.js';

export const postsRouter = Router();

/**
 * GET /api/posts
 * Obtiene publicaciones paginadas con filtros y ordenamiento en el servidor
 */
postsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const validated = PaginationQuerySchema.parse(req.query);
    const { page, pageSize, search, platform, accountId, startDate, endDate, sortBy, sortOrder } = validated;

    const where: any = {};

    if (platform && platform !== 'ALL') {
      where.platform = platform;
    }

    if (accountId) {
      where.socialAccountId = accountId;
    }

    if (search && search.trim() !== '') {
      where.message = { contains: search.trim() };
    }

    if (startDate || endDate) {
      where.publishedAt = {};
      if (startDate) where.publishedAt.gte = new Date(startDate);
      if (endDate) where.publishedAt.lte = new Date(endDate);
    }

    const orderBy: any = {};
    if (sortBy === 'commentsCount') {
      orderBy.totalStoredComments = sortOrder;
    } else {
      orderBy.publishedAt = sortOrder;
    }

    const totalCount = await prisma.socialPost.count({ where });
    const posts = await prisma.socialPost.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        socialAccount: {
          select: {
            name: true,
            username: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    res.json({
      data: posts.map((p) => ({
        id: p.id,
        platform: p.platform,
        externalId: p.externalId,
        message: p.message,
        mediaType: p.mediaType,
        mediaUrl: p.mediaUrl,
        permalink: p.permalink,
        publishedAt: p.publishedAt,
        apiCommentsCount: p.apiCommentsCount,
        repliesCount: p.repliesCount,
        totalStoredComments: p.totalStoredComments,
        lastSyncAt: p.lastSyncAt,
        account: {
          name: p.socialAccount.name,
          username: p.socialAccount.username,
          profilePictureUrl: p.socialAccount.profilePictureUrl,
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

/**
 * GET /api/posts/:id
 * Detalle completo de una publicación y sus comentarios paginados
 */
postsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const post = await prisma.socialPost.findUnique({
      where: { id },
      include: {
        socialAccount: {
          select: {
            name: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        comments: {
          orderBy: { commentDate: 'desc' },
          take: 50,
        },
      },
    });

    if (!post) {
      res.status(404).json({ error: 'Publicación no encontrada.' });
      return;
    }

    res.json(post);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
