import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { voteEngineService } from '../services/vote-engine.service.js';
import { csvImportService } from '../services/csv-import.service.js';
import { seedEbanoVotingDataIfNeeded } from '../services/ebano-voting-seed.service.js';

export const votingRouter = Router();

/**
 * GET /api/voting/dashboard
 * Métricas globales del concurso / convocatoria de Ébano
 */
votingRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    let totalCategories = await prisma.category.count();
    if (totalCategories === 0) {
      await seedEbanoVotingDataIfNeeded();
      totalCategories = await prisma.category.count();
    }
    const totalCandidates = await prisma.candidate.count();

    const categories = await prisma.category.findMany({
      include: {
        candidates: true,
      },
    });

    let totalCommentsReceived = 0;
    let totalValidVotes = 0;
    let totalRepeatedComments = 0;
    let totalFacebookVotes = 0;
    let totalInstagramVotes = 0;

    const categoriesResults = [];

    for (const cat of categories) {
      try {
        const result = await voteEngineService.getCategoryResults(cat.id);
        totalCommentsReceived += result.totalCommentsAnalyzed;
        totalValidVotes += result.totalValidVotes;
        totalRepeatedComments += result.totalRepeatedComments;
        totalFacebookVotes += result.totalFacebookVotes;
        totalInstagramVotes += result.totalInstagramVotes;

        categoriesResults.push({
          id: cat.id,
          name: cat.name,
          edition: cat.edition,
          status: cat.status,
          votingPolicy: cat.votingPolicy,
          candidatesCount: cat.candidates.length,
          totalVotes: result.totalValidVotes,
          leader: result.leader,
          topCandidates: result.candidatesRanking.slice(0, 3),
        });
      } catch (err) {
        // En caso de que no tenga posts asociados aún
        categoriesResults.push({
          id: cat.id,
          name: cat.name,
          edition: cat.edition,
          status: cat.status,
          votingPolicy: cat.votingPolicy,
          candidatesCount: cat.candidates.length,
          totalVotes: 0,
          leader: null,
          topCandidates: [],
        });
      }
    }

    // Candidato con más votos de toda la convocatoria
    let topCandidateOverall: any = null;
    let maxOverallVotes = -1;

    for (const catRes of categoriesResults) {
      if (catRes.leader && catRes.leader.totalVotes > maxOverallVotes) {
        maxOverallVotes = catRes.leader.totalVotes;
        topCandidateOverall = {
          ...catRes.leader,
          categoryName: catRes.name,
        };
      }
    }

    res.json({
      totalCategories,
      totalCandidates,
      totalCommentsReceived,
      totalValidVotes,
      totalRepeatedComments,
      totalFacebookVotes,
      totalInstagramVotes,
      topCandidateOverall,
      platformDistribution: {
        facebook: {
          count: totalFacebookVotes,
          percentage: totalValidVotes > 0 ? Math.round((totalFacebookVotes / totalValidVotes) * 1000) / 10 : 0,
        },
        instagram: {
          count: totalInstagramVotes,
          percentage: totalValidVotes > 0 ? Math.round((totalInstagramVotes / totalValidVotes) * 1000) / 10 : 0,
        },
      },
      categories: categoriesResults,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/voting/categories
 * Lista todas las categorías y convocatorias
 */
votingRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const totalCategories = await prisma.category.count();
    if (totalCategories === 0) {
      await seedEbanoVotingDataIfNeeded();
    }
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            candidates: true,
            posts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voting/categories
 * Crea una nueva categoría
 */
votingRouter.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, edition = '2026', description, votingPolicy = 'ONE_PER_USER_AND_CANDIDATE', allowMultipleMentions = false } = req.body;
    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'El nombre de la categoría es requerido.' });
      return;
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        edition,
        description,
        votingPolicy,
        allowMultipleMentions,
        status: 'PROVISIONAL',
      },
    });

    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/voting/categories/:id
 * Actualiza una categoría y sus reglas
 */
votingRouter.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, description, votingPolicy, status, allowMultipleMentions } = req.body;

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(votingPolicy ? { votingPolicy } : {}),
        ...(status ? { status } : {}),
        ...(allowMultipleMentions !== undefined ? { allowMultipleMentions } : {}),
      },
    });

    // Si cambió la política o status, recalculamos automáticamente
    if (votingPolicy || allowMultipleMentions !== undefined) {
      await voteEngineService.processCategoryVotes(id);
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/voting/candidates
 * Lista candidatos (filtro opcional por categoryId)
 */
votingRouter.get('/candidates', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query;
    const where: any = {};
    if (categoryId) where.categoryId = String(categoryId);

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        category: {
          select: { name: true, slug: true },
        },
      },
      orderBy: [{ number: 'asc' }, { name: 'asc' }],
    });
    res.json(candidates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voting/candidates
 * Registra un nuevo integrante en una categoría
 */
votingRouter.post('/candidates', async (req: Request, res: Response) => {
  try {
    const { categoryId, name, number, aliasList, photoUrl, bio } = req.body;
    if (!categoryId || !name) {
      res.status(400).json({ error: 'categoryId y name son requeridos.' });
      return;
    }

    let parsedAliases = '[]';
    if (Array.isArray(aliasList)) {
      parsedAliases = JSON.stringify(aliasList);
    } else if (typeof aliasList === 'string') {
      try {
        JSON.parse(aliasList);
        parsedAliases = aliasList;
      } catch {
        parsedAliases = JSON.stringify(aliasList.split(',').map((s) => s.trim()).filter(Boolean));
      }
    }

    const candidate = await prisma.candidate.create({
      data: {
        categoryId,
        name: name.trim(),
        number: number ? Number(number) : null,
        aliasList: parsedAliases,
        photoUrl,
        bio,
      },
    });

    // Re-analizar votos de la categoría para asociar comentarios existentes
    await voteEngineService.processCategoryVotes(categoryId);

    res.status(201).json(candidate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/voting/candidates/:id
 * Actualiza datos de un candidato
 */
votingRouter.put('/candidates/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, number, aliasList, photoUrl, bio, status } = req.body;

    let parsedAliases = undefined;
    if (aliasList !== undefined) {
      if (Array.isArray(aliasList)) {
        parsedAliases = JSON.stringify(aliasList);
      } else if (typeof aliasList === 'string') {
        try {
          JSON.parse(aliasList);
          parsedAliases = aliasList;
        } catch {
          parsedAliases = JSON.stringify(aliasList.split(',').map((s) => s.trim()).filter(Boolean));
        }
      }
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(number !== undefined ? { number: number ? Number(number) : null } : {}),
        ...(parsedAliases !== undefined ? { aliasList: parsedAliases } : {}),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(status ? { status } : {}),
      },
    });

    // Re-procesar votos
    await voteEngineService.processCategoryVotes(candidate.categoryId);

    res.json(candidate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voting/posts/associate
 * Asocia publicaciones con una categoría de votación
 */
votingRouter.post('/posts/associate', async (req: Request, res: Response) => {
  try {
    const { postIds, categoryId } = req.body;
    if (!Array.isArray(postIds) || !categoryId) {
      res.status(400).json({ error: 'postIds (array) y categoryId son requeridos.' });
      return;
    }

    await prisma.socialPost.updateMany({
      where: { id: { in: postIds } },
      data: { categoryId },
    });

    // Procesar votos de los posts asociados
    const result = await voteEngineService.processCategoryVotes(categoryId);

    res.json({
      message: `${postIds.length} publicaciones asociadas exitosamente.`,
      result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voting/process/:categoryId
 * Ejecuta el motor de conteo, deduplicación y agrupamiento de votos para una categoría
 */
votingRouter.post('/process/:categoryId', async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId as string;
    const result = await voteEngineService.processCategoryVotes(categoryId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/voting/results/:categoryId
 * Obtiene la tabla comparativa oficial de resultados consolidados
 */
votingRouter.get('/results/:categoryId', async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId as string;
    const results = await voteEngineService.getCategoryResults(categoryId);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/voting/candidate/:candidateId
 * Ficha estadística individual detallada de un integrante
 */
votingRouter.get('/candidate/:candidateId', async (req: Request, res: Response) => {
  try {
    const candidateId = req.params.candidateId as string;
    const candidate = await (prisma.candidate as any).findUnique({
      where: { id: candidateId },
      include: {
        category: true,
        voteRecords: {
          include: {
            comment: {
              include: {
                post: {
                  select: { id: true, message: true, platform: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!candidate) {
      res.status(404).json({ error: 'Integrante no encontrado.' });
      return;
    }

    // Obtener los resultados globales de la categoría para ranking y diferencia
    const categoryResults = await voteEngineService.getCategoryResults(candidate.categoryId);
    const candidateRankInfo = categoryResults.candidatesRanking.find((c) => c.id === candidateId);

    // Conteo detallado
    let validFbVotes = 0;
    let validIgVotes = 0;
    let duplicateCommentsCount = 0;
    let discardedCount = 0;

    // Evolución temporal de votos
    const dateMap = new Map<string, { date: string; facebook: number; instagram: number; total: number }>();

    for (const vr of candidate.voteRecords) {
      const isFb = vr.comment.platform === 'FACEBOOK';
      const dateKey = vr.comment.commentDate.toISOString().split('T')[0];
      const dayData = dateMap.get(dateKey) || { date: dateKey, facebook: 0, instagram: 0, total: 0 };

      if (vr.voteStatus === 'VALID' || vr.voteStatus === 'MANUALLY_APPROVED') {
        if (isFb) {
          validFbVotes++;
          dayData.facebook++;
        } else {
          validIgVotes++;
          dayData.instagram++;
        }
        dayData.total++;
        dateMap.set(dateKey, dayData);
      } else {
        discardedCount++;
        if (vr.voteStatus === 'DUPLICATE_USER' || vr.voteStatus === 'REPEATED_TEXT_SPAM') {
          duplicateCommentsCount++;
        }
      }
    }

    const timeline = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      candidate: {
        id: candidate.id,
        name: candidate.name,
        number: candidate.number,
        photoUrl: candidate.photoUrl,
        bio: candidate.bio,
        status: candidate.status,
        aliasList: JSON.parse(candidate.aliasList || '[]'),
        category: {
          id: candidate.category.id,
          name: candidate.category.name,
          edition: candidate.category.edition,
          status: candidate.category.status,
        },
      },
      stats: {
        facebookVotes: validFbVotes,
        instagramVotes: validIgVotes,
        totalVotes: validFbVotes + validIgVotes,
        percentage: candidateRankInfo?.percentage || 0,
        rank: candidateRankInfo?.rank || 1,
        differenceFromLeader: candidateRankInfo?.differenceFromLeader || 0,
        isWinner: candidateRankInfo?.isWinner || false,
        totalCommentsReceived: candidate.voteRecords.length,
        duplicateCommentsCount,
        discardedCount,
      },
      horizontalBarData: [
        { network: 'Facebook', votos: validFbVotes, fill: '#1877F2' },
        { network: 'Instagram', votos: validIgVotes, fill: '#E1306C' },
        { network: 'Total Consolidado', votos: validFbVotes + validIgVotes, fill: '#4F46E5' },
      ],
      timeline,
      recentComments: candidate.voteRecords.slice(0, 50).map((vr: any) => ({
        id: vr.id,
        commentId: vr.comment.id,
        author: vr.comment.authorName,
        text: vr.comment.text,
        platform: vr.comment.platform,
        date: vr.comment.commentDate,
        status: vr.voteStatus,
        discardReason: vr.discardReason,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/voting/comments
 * Explorador paginado de comentarios con estado de voto y filtros
 */
votingRouter.get('/comments', async (req: Request, res: Response) => {
  try {
    const { categoryId, candidateId, status, platform, search, page = '1', pageSize = '25' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const sizeNum = Math.min(100, Math.max(1, Number(pageSize)));

    const where: any = {};

    if (platform && platform !== 'ALL') {
      where.platform = platform;
    }

    if (search && String(search).trim() !== '') {
      where.OR = [
        { text: { contains: String(search).trim() } },
        { authorName: { contains: String(search).trim() } },
      ];
    }

    if (categoryId) {
      where.post = { categoryId: String(categoryId) };
    }

    if (candidateId || status) {
      where.voteRecord = {};
      if (candidateId) where.voteRecord.candidateId = String(candidateId);
      if (status && status !== 'ALL') where.voteRecord.voteStatus = String(status);
    }

    const totalCount = await prisma.socialComment.count({ where });
    const comments = await prisma.socialComment.findMany({
      where,
      orderBy: { commentDate: 'desc' },
      skip: (pageNum - 1) * sizeNum,
      take: sizeNum,
      include: {
        post: {
          select: {
            id: true,
            message: true,
            platform: true,
            category: { select: { id: true, name: true } },
          },
        },
        voteRecord: {
          include: {
            candidate: { select: { id: true, name: true, number: true } },
          },
        },
      },
    });

    res.json({
      data: comments.map((c) => ({
        id: c.id,
        text: c.text,
        authorName: c.authorName,
        platform: c.platform,
        commentDate: c.commentDate,
        postTitle: c.post?.message || 'Sin título',
        categoryName: c.post?.category?.name || 'Sin categoría',
        voteRecordId: c.voteRecord?.id || null,
        voteStatus: c.voteRecord?.voteStatus || 'UNPROCESSED',
        candidate: c.voteRecord?.candidate || null,
        discardReason: c.voteRecord?.discardReason || null,
        manualNotes: c.voteRecord?.manualNotes || null,
      })),
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        totalCount,
        totalPages: Math.ceil(totalCount / sizeNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voting/audit-vote
 * Corrección y auditoría manual de un voto por un juez/administrador
 */
votingRouter.post('/audit-vote', async (req: Request, res: Response) => {
  try {
    const { voteRecordId, newStatus, newCandidateId, changedBy = 'Administrador Ébano', reason } = req.body;

    if (!voteRecordId || !newStatus || !reason) {
      res.status(400).json({ error: 'voteRecordId, newStatus y reason son requeridos.' });
      return;
    }

    const updated = await voteEngineService.auditVoteRecord(voteRecordId, {
      newStatus,
      newCandidateId,
      changedBy,
      reason,
    });

    res.json({
      message: 'Voto auditado y corregido exitosamente.',
      record: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voting/import-csv
 * Importa comentarios desde un archivo o texto CSV para una categoría/post
 */
votingRouter.post('/import-csv', async (req: Request, res: Response) => {
  try {
    const { csvContent, postId, socialAccountId, categoryId } = req.body;

    if (!csvContent || (!postId && !categoryId)) {
      res.status(400).json({ error: 'csvContent y postId (o categoryId) son requeridos.' });
      return;
    }

    let targetPostId = postId;
    let targetAccountId = socialAccountId;

    // Si se especifica categoryId pero no postId, buscar o crear un post contenedor
    if (!targetPostId && categoryId) {
      let post = await prisma.socialPost.findFirst({
        where: { categoryId },
      });

      if (!post) {
        // Obtener la primera cuenta disponible
        let account = await prisma.socialAccount.findFirst();
        if (!account) {
          res.status(400).json({ error: 'No hay cuentas registradas en el sistema para asociar la importación.' });
          return;
        }
        targetAccountId = account.id;

        post = await prisma.socialPost.create({
          data: {
            socialAccountId: account.id,
            platform: account.platform,
            externalId: `import_post_${Date.now()}`,
            message: `Publicación de importación CSV - Categoría ${categoryId}`,
            publishedAt: new Date(),
            categoryId,
          },
        });
      }

      targetPostId = post.id;
      targetAccountId = post.socialAccountId;
    }

    const parsedRows = csvImportService.parseCsv(csvContent);
    const result = await csvImportService.importComments(parsedRows, {
      postId: targetPostId,
      socialAccountId: targetAccountId,
    });

    // Re-procesar votos automáticamente si el post tiene categoría
    const postObj = await prisma.socialPost.findUnique({ where: { id: targetPostId } });
    if (postObj?.categoryId) {
      await voteEngineService.processCategoryVotes(postObj.categoryId);
    }

    res.json({
      message: `Importación procesada: ${result.imported} comentarios nuevos, ${result.duplicates} duplicados omitidos.`,
      result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/voting/export/:categoryId/csv
 * Exporta resultados consolidados en formato CSV compatible con Excel
 */
votingRouter.get('/export/:categoryId/csv', async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId as string;
    const results = await voteEngineService.getCategoryResults(categoryId);

    const rows: string[] = [];
    rows.push(`CONSOLIDADO OFICIAL DE VOTACION - ${results.categoryName.toUpperCase()} (${results.categoryStatus})`);
    rows.push(`Fecha de Generacion: ${new Date().toLocaleString('es-ES')}`);
    rows.push(`Regla de Conteo: ${results.votingPolicy}`);
    rows.push(`Total Votos Validos: ${results.totalValidVotes} (Facebook: ${results.totalFacebookVotes} | Instagram: ${results.totalInstagramVotes})`);
    rows.push(`Comentarios Descartados: ${results.totalDiscardedComments}`);
    rows.push('');
    rows.push('Posición,Integrante,Número,Votos Facebook,Votos Instagram,Total Consolidado,Porcentaje,Diferencia Líder,Estado');

    for (const cand of results.candidatesRanking) {
      rows.push(
        [
          cand.rank,
          `"${cand.name.replace(/"/g, '""')}"`,
          cand.number || '-',
          cand.facebookVotes,
          cand.instagramVotes,
          cand.totalVotes,
          `"${cand.percentage}%"`,
          cand.differenceFromLeader,
          cand.isWinner ? (results.categoryStatus === 'DEFINITIVE' ? 'Ganador Definitivo' : 'Ganador Provisional') : 'Participante',
        ].join(',')
      );
    }

    const csvData = '\uFEFF' + rows.join('\r\n');
    const filename = `ebano_votacion_${results.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
