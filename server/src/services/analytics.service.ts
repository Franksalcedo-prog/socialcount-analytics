import { prisma } from '../db/prisma.js';

export interface AnalyticsFilterParams {
  platform?: 'FACEBOOK' | 'INSTAGRAM' | 'ALL';
  accountId?: string;
  startDate?: string;
  endDate?: string;
  includeReplies?: boolean;
}

export interface DashboardMetrics {
  totalComments: number;
  facebookComments: number;
  instagramComments: number;
  todayComments: number;
  monitoredPosts: number;
  monitoredAccounts: number;
  lastSyncAt: Date | null;
  periodComparison: {
    currentPeriodCount: number;
    previousPeriodCount: number;
    percentageChange: number; // e.g. +18.4% or -5.2%
    isPositive: boolean;
  };
  evolutionChart: Array<{
    date: string;
    total: number;
    facebook: number;
    instagram: number;
  }>;
  platformDistribution: {
    facebook: { count: number; percentage: number };
    instagram: { count: number; percentage: number };
  };
  topPosts: Array<{
    id: string;
    platform: string;
    message: string | null;
    mediaUrl: string | null;
    permalink: string | null;
    publishedAt: Date;
    commentsCount: number;
    repliesCount: number;
    accountName: string;
    topCommenter?: { name: string; count: number } | null;
    topMentioned?: { username: string; count: number } | null;
  }>;
  weekdayActivity: Array<{
    day: string;
    dayNumber: number;
    facebook: number;
    instagram: number;
    total: number;
  }>;
}

export class AnalyticsService {
  /**
   * Obtiene todas las métricas agregadas del Dashboard respetando los filtros
   */
  public async getDashboardMetrics(params: AnalyticsFilterParams): Promise<DashboardMetrics> {
    const { platform, accountId, startDate, endDate, includeReplies = true } = params;

    // 1. Determinar rango de fechas actual y previo para el cálculo de variación
    const now = new Date();
    const end = endDate ? new Date(endDate) : now;
    // Si no se especifica startDate, usamos por defecto los últimos 30 días
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const periodDuration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodDuration);
    const previousEnd = new Date(start.getTime());

    // 2. Construir cláusulas Where base
    const baseWhere: any = {};

    if (platform && platform !== 'ALL') {
      baseWhere.platform = platform;
    }

    if (accountId) {
      baseWhere.socialAccountId = accountId;
    }

    if (!includeReplies) {
      baseWhere.isReply = false;
    }

    // 3. Conteo del período actual
    const currentPeriodWhere = {
      ...baseWhere,
      commentDate: {
        gte: start,
        lte: end,
      },
    };

    const currentPeriodCount = await prisma.socialComment.count({
      where: currentPeriodWhere,
    });

    // 4. Conteo del período previo para comparación porcentual
    const previousPeriodWhere = {
      ...baseWhere,
      commentDate: {
        gte: previousStart,
        lt: previousEnd,
      },
    };

    const previousPeriodCount = await prisma.socialComment.count({
      where: previousPeriodWhere,
    });

    // Calcular variación porcentual
    let percentageChange = 0;
    if (previousPeriodCount > 0) {
      percentageChange = Math.round(((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 1000) / 10;
    } else if (currentPeriodCount > 0) {
      percentageChange = 100;
    }

    // 5. Conteo por plataforma en el período actual
    const fbWhere = { ...currentPeriodWhere, platform: 'FACEBOOK' };
    const igWhere = { ...currentPeriodWhere, platform: 'INSTAGRAM' };

    const facebookComments = await prisma.socialComment.count({ where: fbWhere });
    const instagramComments = await prisma.socialComment.count({ where: igWhere });
    const totalPeriodComments = facebookComments + instagramComments;

    const fbPercentage = totalPeriodComments > 0 ? Math.round((facebookComments / totalPeriodComments) * 1000) / 10 : 0;
    const igPercentage = totalPeriodComments > 0 ? Math.round((instagramComments / totalPeriodComments) * 1000) / 10 : 0;

    // 6. Comentarios de hoy (00:00 hasta ahora)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayComments = await prisma.socialComment.count({
      where: {
        ...baseWhere,
        commentDate: { gte: todayStart },
      },
    });

    // 7. Publicaciones monitoreadas y cuentas
    const postWhere: any = {};
    if (platform && platform !== 'ALL') postWhere.platform = platform;
    if (accountId) postWhere.socialAccountId = accountId;

    const monitoredPosts = await prisma.socialPost.count({ where: postWhere });
    const monitoredAccounts = await prisma.socialAccount.count({
      where: {
        isMonitored: true,
        ...(platform && platform !== 'ALL' ? { platform } : {}),
      },
    });

    // 8. Fecha del último proceso de sincronización
    const lastSyncAccount = await prisma.socialAccount.findFirst({
      where: { lastSyncAt: { not: null } },
      orderBy: { lastSyncAt: 'desc' },
      select: { lastSyncAt: true },
    });
    const lastSyncAt = lastSyncAccount?.lastSyncAt || null;

    // 9. Evolución temporal de comentarios agrupados por fecha
    const allCommentsInPeriod = await prisma.socialComment.findMany({
      where: currentPeriodWhere,
      select: {
        commentDate: true,
        platform: true,
      },
      orderBy: { commentDate: 'asc' },
    });

    // Agrupación por día
    const dailyMap = new Map<string, { total: number; facebook: number; instagram: number }>();

    // Inicializar todos los días del rango para evitar saltos vacíos
    const curCursor = new Date(start);
    while (curCursor <= end) {
      const dateKey = curCursor.toISOString().split('T')[0];
      dailyMap.set(dateKey, { total: 0, facebook: 0, instagram: 0 });
      curCursor.setDate(curCursor.getDate() + 1);
    }

    for (const c of allCommentsInPeriod) {
      const dateKey = c.commentDate.toISOString().split('T')[0];
      const entry = dailyMap.get(dateKey) || { total: 0, facebook: 0, instagram: 0 };
      entry.total++;
      if (c.platform === 'FACEBOOK') entry.facebook++;
      if (c.platform === 'INSTAGRAM') entry.instagram++;
      dailyMap.set(dateKey, entry);
    }

    const evolutionChart = Array.from(dailyMap.entries()).map(([date, counts]) => ({
      date,
      total: counts.total,
      facebook: counts.facebook,
      instagram: counts.instagram,
    }));

    // 10. Top 5 publicaciones con más comentarios
    const topPostsRecords = await prisma.socialPost.findMany({
      where: postWhere,
      include: {
        socialAccount: { select: { name: true } },
        comments: {
          select: {
            authorName: true,
            text: true,
          },
        },
      },
      orderBy: { totalStoredComments: 'desc' },
      take: 5,
    });

    const mentionRegex = /@([a-zA-Z0-9._]+)/g;

    const topPosts = topPostsRecords.map((p) => {
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
        message: p.message,
        mediaUrl: p.mediaUrl,
        permalink: p.permalink,
        publishedAt: p.publishedAt,
        commentsCount: p.totalStoredComments,
        repliesCount: p.repliesCount,
        accountName: p.socialAccount?.name || 'Desconocida',
        topCommenter: sortedAuthors.length > 0 ? { name: sortedAuthors[0][0], count: sortedAuthors[0][1] } : null,
        topMentioned: sortedMentions.length > 0 ? { username: sortedMentions[0][0], count: sortedMentions[0][1] } : null,
      };
    });

    // 11. Actividad por día de la semana (Lunes a Domingo)
    const weekdaysNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const weekdayMap = Array.from({ length: 7 }, (_, i) => ({
      day: weekdaysNames[i],
      dayNumber: i,
      facebook: 0,
      instagram: 0,
      total: 0,
    }));

    for (const c of allCommentsInPeriod) {
      const dayIdx = c.commentDate.getDay();
      weekdayMap[dayIdx].total++;
      if (c.platform === 'FACEBOOK') weekdayMap[dayIdx].facebook++;
      if (c.platform === 'INSTAGRAM') weekdayMap[dayIdx].instagram++;
    }

    // Reordenar para empezar en Lunes (índice 1..6 y luego 0)
    const weekdayActivity = [
      ...weekdayMap.slice(1),
      weekdayMap[0],
    ];

    return {
      totalComments: currentPeriodCount,
      facebookComments,
      instagramComments,
      todayComments,
      monitoredPosts,
      monitoredAccounts,
      lastSyncAt,
      periodComparison: {
        currentPeriodCount,
        previousPeriodCount,
        percentageChange,
        isPositive: percentageChange >= 0,
      },
      evolutionChart,
      platformDistribution: {
        facebook: { count: facebookComments, percentage: fbPercentage },
        instagram: { count: instagramComments, percentage: igPercentage },
      },
      topPosts,
      weekdayActivity,
    };
  }
}

export const analyticsService = new AnalyticsService();
