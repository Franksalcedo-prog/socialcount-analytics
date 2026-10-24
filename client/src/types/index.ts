export type Platform = 'FACEBOOK' | 'INSTAGRAM' | 'ALL';

export type DateRangePreset = 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'allTime';

export interface SocialAccount {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  externalId: string;
  name: string;
  username: string | null;
  profilePictureUrl: string | null;
  tokenStatus: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'NEEDS_REAUTH';
  tokenExpiresAt: string | null;
  isMonitored: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  permissions: string[];
  postsCount: number;
  commentsCount: number;
  isDemo: boolean;
}

export interface SocialPost {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  externalId: string;
  message: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  permalink: string | null;
  publishedAt: string;
  apiCommentsCount: number;
  repliesCount: number;
  totalStoredComments: number;
  lastSyncAt: string;
  topCommenter?: { name: string; count: number } | null;
  topMentioned?: { username: string; count: number } | null;
  commentersRanking?: Array<{ name: string; count: number }>;
  mentionsRanking?: Array<{ username: string; count: number }>;
  account: {
    name: string;
    username: string | null;
    profilePictureUrl: string | null;
  };
}

export interface SocialComment {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  externalId: string;
  parentCommentId: string | null;
  authorName: string;
  authorExternalId: string | null;
  text: string;
  commentDate: string;
  isReply: boolean;
  replyCount: number;
  status: string;
  capturedAt: string;
  accountName: string;
  post: {
    id: string;
    message: string | null;
    permalink: string | null;
    mediaUrl: string | null;
  };
}

export interface DashboardMetrics {
  totalComments: number;
  facebookComments: number;
  instagramComments: number;
  todayComments: number;
  monitoredPosts: number;
  monitoredAccounts: number;
  lastSyncAt: string | null;
  periodComparison: {
    currentPeriodCount: number;
    previousPeriodCount: number;
    percentageChange: number;
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
    publishedAt: string;
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

export interface SyncJob {
  id: string;
  socialAccountId: string | null;
  triggerSource: 'MANUAL' | 'SCHEDULED' | 'WEBHOOK';
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  postsProcessed: number;
  commentsFetched: number;
  commentsAdded: number;
  commentsUpdated: number;
  errorSummary: string | null;
  socialAccount?: {
    name: string;
    platform: string;
  };
  logs?: Array<{
    id: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
    timestamp: string;
  }>;
}

export interface SystemSettingsInfo {
  environment: string;
  nodeVersion: string;
  uptimeSeconds: number;
  database: {
    provider: string;
    status: string;
    accountsCount: number;
    postsCount: number;
    commentsCount: number;
  };
  meta: {
    isConfigured: boolean;
    apiVersion: string;
    appId: string;
    redirectUri: string;
    webhookEndpoint: string;
    webhookVerifyToken: string;
  };
  demoModeActive: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
