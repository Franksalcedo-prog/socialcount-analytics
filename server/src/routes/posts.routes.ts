import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { PaginationQuerySchema } from '../schemas/index.js';
import { schemaMigrationService } from '../services/schema-migration.service.js';

export const postsRouter = Router();

/**
 * GET /api/posts
 * Obtiene publicaciones paginadas con filtros y ordenamiento en el servidor
 */
postsRouter.get('/', async (req: Request, res: Response) => {
  try {
    await schemaMigrationService.ensureTablesExist();
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
        comments: {
          select: {
            authorName: true,
            text: true,
          },
        },
      },
    });

    const mentionRegex = /@([a-zA-Z0-9._]+)/g;

    res.json({
      data: posts.map((p) => {
        const authorCounts: Record<string, number> = {};
        const mentionCounts: Record<string, number> = {};

        for (const c of p.comments) {
          if (c.authorName) {
            authorCounts[c.authorName] = (authorCounts[c.authorName] || 0) + 1;
          }
          let match;
          while ((match = mentionRegex.exec(c.text)) !== null) {
            const handle = `@${match[1]}`;
            mentionCounts[handle] = (mentionCounts[handle] || 0) + 1;
          }
        }

        const sortedAuthors = Object.entries(authorCounts).sort((a, b) => b[1] - a[1]);
        const sortedMentions = Object.entries(mentionCounts).sort((a, b) => b[1] - a[1]);

        return {
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
          topCommenter: sortedAuthors.length > 0 ? { name: sortedAuthors[0][0], count: sortedAuthors[0][1] } : null,
          topMentioned: sortedMentions.length > 0 ? { username: sortedMentions[0][0], count: sortedMentions[0][1] } : null,
          account: {
            name: p.socialAccount.name,
            username: p.socialAccount.username,
            profilePictureUrl: p.socialAccount.profilePictureUrl,
          },
        };
      }),
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
 * Detalle completo de una publicación y sus comentarios paginados con top comentarista
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
          take: 100,
        },
      },
    });

    if (!post) {
      res.status(404).json({ error: 'Publicación no encontrada.' });
      return;
    }

    const authorCounts: Record<string, number> = {};
    const mentionCounts: Record<string, number> = {};
    const mentionRegex = /@([a-zA-Z0-9._]+)/g;

    for (const c of post.comments) {
      if (c.authorName) {
        authorCounts[c.authorName] = (authorCounts[c.authorName] || 0) + 1;
      }
      let match;
      while ((match = mentionRegex.exec(c.text)) !== null) {
        const handle = `@${match[1]}`;
        mentionCounts[handle] = (mentionCounts[handle] || 0) + 1;
      }
    }

    const sortedAuthors = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    const sortedMentions = Object.entries(mentionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([username, count]) => ({ username, count }));

    res.json({
      ...post,
      topCommenter: sortedAuthors.length > 0 ? sortedAuthors[0] : null,
      topMentioned: sortedMentions.length > 0 ? sortedMentions[0] : null,
      commentersRanking: sortedAuthors.slice(0, 5),
      mentionsRanking: sortedMentions.slice(0, 5),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
