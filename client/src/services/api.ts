import axios from 'axios';
import {
  DashboardMetrics,
  SocialAccount,
  SocialPost,
  SocialComment,
  SyncJob,
  SystemSettingsInfo,
  PaginatedResponse,
  Platform,
  CategoryItem,
  CandidateItem,
  CategoryResultData,
  CandidateDetailData,
  VotingDashboardData,
  VotingCommentItem,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const apiService = {
  // Analítica & Dashboard
  async getDashboardMetrics(params: {
    platform?: Platform;
    accountId?: string;
    startDate?: string;
    endDate?: string;
    includeReplies?: boolean;
  }): Promise<DashboardMetrics> {
    const res = await api.get('/analytics/dashboard', {
      params: {
        platform: params.platform || 'ALL',
        accountId: params.accountId,
        startDate: params.startDate,
        endDate: params.endDate,
        includeReplies: params.includeReplies !== undefined ? String(params.includeReplies) : 'true',
      },
    });
    return res.data;
  },

  // Cuentas Conectadas
  async getAccounts(): Promise<SocialAccount[]> {
    const res = await api.get('/accounts');
    return res.data;
  },

  async updateAccount(id: string, data: { isMonitored?: boolean }): Promise<void> {
    await api.patch(`/accounts/${id}`, data);
  },

  async disconnectAccount(id: string): Promise<void> {
    await api.delete(`/accounts/${id}`);
  },

  async resetDemoAccounts(): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/accounts/reset-demo');
    return res.data;
  },

  // Publicaciones
  async getPosts(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    platform?: Platform;
    accountId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'publishedAt' | 'commentsCount';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<SocialPost>> {
    const res = await api.get('/posts', { params });
    return res.data;
  },

  async getPostDetail(id: string): Promise<SocialPost & { comments: SocialComment[] }> {
    const res = await api.get(`/posts/${id}`);
    return res.data;
  },

  // Comentarios
  async getComments(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    platform?: Platform;
    accountId?: string;
    postId?: string;
    startDate?: string;
    endDate?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<SocialComment>> {
    const res = await api.get('/comments', { params });
    return res.data;
  },

  // Sincronización
  async triggerSync(accountId?: string): Promise<{
    success: boolean;
    jobId: string;
    status: string;
    postsProcessed: number;
    commentsAdded: number;
    commentsUpdated: number;
    durationMs: number;
    message: string;
  }> {
    const res = await api.post('/sync/trigger', { accountId });
    return res.data;
  },

  async getSyncHistory(): Promise<SyncJob[]> {
    const res = await api.get('/sync/history');
    return res.data;
  },

  async getActiveSync(): Promise<{ hasActiveJob: boolean; job: SyncJob | null }> {
    const res = await api.get('/sync/active');
    return res.data;
  },

  // Configuración del Sistema
  async getSystemSettings(): Promise<SystemSettingsInfo> {
    const res = await api.get('/settings/info');
    return res.data;
  },

  // URL para Descarga de Exportación CSV
  getCsvExportUrl(params: {
    platform?: Platform;
    accountId?: string;
    postId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): string {
    const query = new URLSearchParams();
    if (params.platform && params.platform !== 'ALL') query.set('platform', params.platform);
    if (params.accountId) query.set('accountId', params.accountId);
    if (params.postId) query.set('postId', params.postId);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.search) query.set('search', params.search);
    return `/api/export/comments/csv?${query.toString()}`;
  },

  // ==========================================
  // MÓDULO DE VOTACIÓN Y CONSOLIDACIÓN ÉBANO
  // ==========================================

  async getVotingDashboard(): Promise<VotingDashboardData> {
    const res = await api.get('/voting/dashboard');
    return res.data;
  },

  async getVotingCategories(): Promise<CategoryItem[]> {
    const res = await api.get('/voting/categories');
    return res.data;
  },

  async createCategory(data: Partial<CategoryItem>): Promise<CategoryItem> {
    const res = await api.post('/voting/categories', data);
    return res.data;
  },

  async updateCategory(id: string, data: Partial<CategoryItem>): Promise<CategoryItem> {
    const res = await api.put(`/voting/categories/${id}`, data);
    return res.data;
  },

  async getVotingCandidates(categoryId?: string): Promise<CandidateItem[]> {
    const res = await api.get('/voting/candidates', { params: { categoryId } });
    return res.data;
  },

  async createCandidate(data: any): Promise<CandidateItem> {
    const res = await api.post('/voting/candidates', data);
    return res.data;
  },

  async updateCandidate(id: string, data: any): Promise<CandidateItem> {
    const res = await api.put(`/voting/candidates/${id}`, data);
    return res.data;
  },

  async associatePostsToCategory(postIds: string[], categoryId: string): Promise<any> {
    const res = await api.post('/voting/posts/associate', { postIds, categoryId });
    return res.data;
  },

  async processCategoryVotes(categoryId: string): Promise<CategoryResultData> {
    const res = await api.post(`/voting/process/${categoryId}`);
    return res.data;
  },

  async getCategoryResults(categoryId: string): Promise<CategoryResultData> {
    const res = await api.get(`/voting/results/${categoryId}`);
    return res.data;
  },

  async getCandidateDetail(candidateId: string): Promise<CandidateDetailData> {
    const res = await api.get(`/voting/candidate/${candidateId}`);
    return res.data;
  },

  async getVotingComments(params: {
    categoryId?: string;
    candidateId?: string;
    status?: string;
    platform?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<VotingCommentItem>> {
    const res = await api.get('/voting/comments', { params });
    return res.data;
  },

  async auditVote(data: {
    voteRecordId: string;
    newStatus: string;
    newCandidateId?: string | null;
    changedBy?: string;
    reason: string;
  }): Promise<any> {
    const res = await api.post('/voting/audit-vote', data);
    return res.data;
  },

  async importCommentsCsv(data: {
    csvContent: string;
    postId?: string;
    categoryId?: string;
    socialAccountId?: string;
  }): Promise<any> {
    const res = await api.post('/voting/import-csv', data);
    return res.data;
  },

  getVotingCsvExportUrl(categoryId: string): string {
    return `/api/voting/export/${categoryId}/csv`;
  },
};
