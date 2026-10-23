import { z } from 'zod';

export const PlatformSchema = z.enum(['FACEBOOK', 'INSTAGRAM', 'ALL']);

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  preset: z.enum(['today', 'last7days', 'last30days', 'thisMonth', 'allTime']).optional(),
});

export const AnalyticsQuerySchema = z.object({
  platform: PlatformSchema.default('ALL'),
  accountId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeReplies: z.enum(['true', 'false']).default('true'),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  platform: PlatformSchema.default('ALL'),
  accountId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['publishedAt', 'commentDate', 'commentsCount', 'replyCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const TriggerSyncSchema = z.object({
  accountId: z.string().uuid().optional(),
  includeHistorical: z.boolean().default(false),
});

export const UpdateAccountSettingsSchema = z.object({
  isMonitored: z.boolean().optional(),
});

export const WebhookEventSchema = z.object({
  object: z.string(),
  entry: z.array(z.record(z.any())),
});
