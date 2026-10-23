import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config/env.js';
import { decryptToken } from './encryption.service.js';

export interface MetaPageItem {
  id: string;
  name: string;
  category?: string;
  accessToken: string;
  pictureUrl?: string;
  tasks?: string[];
  instagramBusinessAccount?: {
    id: string;
    username: string;
    name?: string;
    profilePictureUrl?: string;
  } | null;
}

export interface MetaPostItem {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  message: string | null;
  mediaType: string;
  mediaUrl: string | null;
  permalink: string | null;
  publishedAt: Date;
  apiCommentsCount: number;
}

export interface MetaCommentItem {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  parentCommentId?: string | null;
  authorName?: string | null;
  authorExternalId?: string | null;
  text: string;
  commentDate: Date;
  isReply: boolean;
  replies?: MetaCommentItem[];
}

export class MetaApiService {
  private client: AxiosInstance;
  private apiVersion: string;

  constructor() {
    this.apiVersion = config.meta.apiVersion;
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      timeout: 20000,
    });
  }

  /**
   * Genera la URL de OAuth oficial de Meta con parámetros de seguridad (state con nonce)
   */
  public getAuthorizationUrl(state: string): string {
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_read_user_content',
      'instagram_basic',
      'instagram_manage_comments',
      'read_insights',
    ].join(',');

    const params = new URLSearchParams({
      client_id: config.meta.appId,
      redirect_uri: config.meta.redirectUri,
      state,
      scope: scopes,
      response_type: 'code',
    });

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  /**
   * Intercambia el código de autorización por un User Token de corta duración
   */
  public async exchangeCodeForToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await this.client.get('/oauth/access_token', {
        params: {
          client_id: config.meta.appId,
          client_secret: config.meta.appSecret,
          redirect_uri: config.meta.redirectUri,
          code,
        },
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in || 3600,
      };
    } catch (error) {
      this.handleApiError(error, 'exchangeCodeForToken');
      throw error;
    }
  }

  /**
   * Intercambia un Short-Lived User Token por un Long-Lived Token (duración ~60 días)
   */
  public async getLongLivedUserToken(shortLivedToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await this.client.get('/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: config.meta.appId,
          client_secret: config.meta.appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in || 5184000, // 60 días
      };
    } catch (error) {
      this.handleApiError(error, 'getLongLivedUserToken');
      throw error;
    }
  }

  /**
   * Consulta las Páginas de Facebook administradas y sus cuentas de Instagram vinculadas
   */
  public async getManagedPagesAndInstagram(userAccessToken: string): Promise<MetaPageItem[]> {
    try {
      // 1. Obtener páginas con campos relevantes
      const response = await this.client.get('/me/accounts', {
        params: {
          access_token: userAccessToken,
          fields: 'id,name,category,access_token,tasks,picture{url}',
          limit: 100,
        },
      });

      const pages: MetaPageItem[] = [];

      for (const item of response.data.data || []) {
        let igAccount = null;

        // 2. Comprobar si tiene cuenta de Instagram Business asociada
        try {
          const igRes = await this.client.get(`/${item.id}`, {
            params: {
              access_token: item.access_token,
              fields: 'instagram_business_account{id,username,name,profile_picture_url}',
            },
          });

          if (igRes.data?.instagram_business_account) {
            const igData = igRes.data.instagram_business_account;
            igAccount = {
              id: igData.id,
              username: igData.username,
              name: igData.name || igData.username,
              profilePictureUrl: igData.profile_picture_url || null,
            };
          }
        } catch {
          // Si la página no tiene IG Business vinculado, continuamos
          igAccount = null;
        }

        pages.push({
          id: item.id,
          name: item.name,
          category: item.category,
          accessToken: item.access_token,
          pictureUrl: item.picture?.data?.url || null,
          tasks: item.tasks || [],
          instagramBusinessAccount: igAccount,
        });
      }

      return pages;
    } catch (error) {
      this.handleApiError(error, 'getManagedPagesAndInstagram');
      throw error;
    }
  }

  /**
   * Obtiene publicaciones de una Página de Facebook con resumen de conteo de comentarios
   */
  public async getFacebookPagePosts(
    pageId: string,
    encryptedAccessToken: string,
    limit = 25
  ): Promise<MetaPostItem[]> {
    const accessToken = decryptToken(encryptedAccessToken);

    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.get(`/${pageId}/published_posts`, {
          params: {
            access_token: accessToken,
            fields: 'id,message,created_time,permalink_url,full_picture,comments.summary(true).limit(0)',
            limit,
          },
        });
      });

      return (response.data.data || []).map((post: any) => ({
        id: post.id,
        platform: 'FACEBOOK',
        message: post.message || null,
        mediaType: post.full_picture ? 'IMAGE' : 'STATUS',
        mediaUrl: post.full_picture || null,
        permalink: post.permalink_url || `https://facebook.com/${post.id}`,
        publishedAt: new Date(post.created_time),
        apiCommentsCount: post.comments?.summary?.total_count || 0,
      }));
    } catch (error) {
      this.handleApiError(error, `getFacebookPagePosts for ${pageId}`);
      throw error;
    }
  }

  /**
   * Obtiene publicaciones (media) de una cuenta de Instagram Profesional
   */
  public async getInstagramMedia(
    igBusinessId: string,
    encryptedAccessToken: string,
    limit = 25
  ): Promise<MetaPostItem[]> {
    const accessToken = decryptToken(encryptedAccessToken);

    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.get(`/${igBusinessId}/media`, {
          params: {
            access_token: accessToken,
            fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count',
            limit,
          },
        });
      });

      return (response.data.data || []).map((media: any) => ({
        id: media.id,
        platform: 'INSTAGRAM',
        message: media.caption || null,
        mediaType: media.media_type || 'IMAGE',
        mediaUrl: media.media_url || media.thumbnail_url || null,
        permalink: media.permalink || null,
        publishedAt: new Date(media.timestamp),
        apiCommentsCount: media.comments_count || 0,
      }));
    } catch (error) {
      this.handleApiError(error, `getInstagramMedia for ${igBusinessId}`);
      throw error;
    }
  }

  /**
   * Obtiene comentarios y respuestas de un post de Facebook con paginación cursor
   */
  public async getFacebookComments(
    postId: string,
    encryptedAccessToken: string
  ): Promise<MetaCommentItem[]> {
    const accessToken = decryptToken(encryptedAccessToken);
    const commentsList: MetaCommentItem[] = [];
    let nextUrl: string | null = null;
    let pagesFetched = 0;
    const maxPages = 10; // límite de seguridad de paginación por post

    try {
      do {
        const response: any = await this.executeWithRetry(async () => {
          if (nextUrl) {
            return axios.get(nextUrl);
          }
          return this.client.get(`/${postId}/comments`, {
            params: {
              access_token: accessToken,
              fields: 'id,message,created_time,from,like_count,comments{id,message,created_time,from}',
              limit: 100,
            },
          });
        });

        const data = response.data?.data || [];
        for (const item of data) {
          const replies: MetaCommentItem[] = [];

          if (item.comments?.data) {
            for (const r of item.comments.data) {
              replies.push({
                id: r.id,
                platform: 'FACEBOOK',
                parentCommentId: item.id,
                authorName: r.from?.name || null,
                authorExternalId: r.from?.id || null,
                text: r.message || '',
                commentDate: new Date(r.created_time),
                isReply: true,
              });
            }
          }

          commentsList.push({
            id: item.id,
            platform: 'FACEBOOK',
            parentCommentId: null,
            authorName: item.from?.name || null,
            authorExternalId: item.from?.id || null,
            text: item.message || '',
            commentDate: new Date(item.created_time),
            isReply: false,
            replies,
          });
        }

        nextUrl = response.data?.paging?.next || null;
        pagesFetched++;
      } while (nextUrl && pagesFetched < maxPages);

      return commentsList;
    } catch (error) {
      this.handleApiError(error, `getFacebookComments for ${postId}`);
      throw error;
    }
  }

  /**
   * Obtiene comentarios y respuestas de un post de Instagram con paginación cursor
   */
  public async getInstagramComments(
    mediaId: string,
    encryptedAccessToken: string
  ): Promise<MetaCommentItem[]> {
    const accessToken = decryptToken(encryptedAccessToken);
    const commentsList: MetaCommentItem[] = [];
    let nextUrl: string | null = null;
    let pagesFetched = 0;
    const maxPages = 10;

    try {
      do {
        const response: any = await this.executeWithRetry(async () => {
          if (nextUrl) {
            return axios.get(nextUrl);
          }
          return this.client.get(`/${mediaId}/comments`, {
            params: {
              access_token: accessToken,
              fields: 'id,text,timestamp,username,like_count,replies{id,text,timestamp,username}',
              limit: 100,
            },
          });
        });

        const data = response.data?.data || [];
        for (const item of data) {
          const replies: MetaCommentItem[] = [];

          if (item.replies?.data) {
            for (const r of item.replies.data) {
              replies.push({
                id: r.id,
                platform: 'INSTAGRAM',
                parentCommentId: item.id,
                authorName: r.username || null,
                authorExternalId: r.username || null,
                text: r.text || '',
                commentDate: new Date(r.timestamp),
                isReply: true,
              });
            }
          }

          commentsList.push({
            id: item.id,
            platform: 'INSTAGRAM',
            parentCommentId: null,
            authorName: item.username || null,
            authorExternalId: item.username || null,
            text: item.text || '',
            commentDate: new Date(item.timestamp),
            isReply: false,
            replies,
          });
        }

        nextUrl = response.data?.paging?.next || null;
        pagesFetched++;
      } while (nextUrl && pagesFetched < maxPages);

      return commentsList;
    } catch (error) {
      this.handleApiError(error, `getInstagramComments for ${mediaId}`);
      throw error;
    }
  }

  /**
   * Ejecuta peticiones a la API con Backoff Exponencial y manejo de Rate Limits
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await fn();
      } catch (error: any) {
        attempt++;
        const isRateLimit =
          error?.response?.status === 429 ||
          error?.response?.data?.error?.code === 4 ||
          error?.response?.data?.error?.code === 17 ||
          error?.response?.data?.error?.code === 613;

        if (isRateLimit && attempt < maxRetries) {
          // Espera exponencial: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }

        throw error;
      }
    }

    throw new Error('Número máximo de reintentos alcanzado en Meta Graph API.');
  }

  /**
   * Manejador de errores centralizado sin exponer tokens
   */
  private handleApiError(error: unknown, context: string): void {
    if (axios.isAxiosError(error)) {
      const err = error as AxiosError<any>;
      const metaError = err.response?.data?.error;
      console.error(`[MetaApi Error] en ${context}:`, {
        status: err.response?.status,
        message: metaError?.message || err.message,
        type: metaError?.type,
        code: metaError?.code,
        error_subcode: metaError?.error_subcode,
      });
    } else {
      console.error(`[MetaApi Unexpected Error] en ${context}:`, (error as Error).message);
    }
  }
}

export const metaApiService = new MetaApiService();
