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

// ==========================================
// TIPOS DEL MÓDULO DE VOTACIÓN ÉBANO
// ==========================================

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  edition: string;
  description: string | null;
  votingPolicy: 'EVERY_VALID_COMMENT' | 'ONE_PER_USER_AND_CANDIDATE' | 'ONE_PER_USER_PER_CATEGORY';
  status: 'PROVISIONAL' | 'DEFINITIVE';
  allowMultipleMentions: boolean;
  createdAt: string;
  _count?: {
    candidates: number;
    posts: number;
  };
}

export interface CandidateItem {
  id: string;
  categoryId: string;
  name: string;
  number: number | null;
  aliasList: string[];
  photoUrl: string | null;
  bio: string | null;
  status: string;
  category?: {
    name: string;
    slug: string;
  };
}

export interface CategoryResultData {
  categoryId: string;
  categoryName: string;
  categoryStatus: 'PROVISIONAL' | 'DEFINITIVE';
  votingPolicy: string;
  totalCommentsAnalyzed: number;
  totalValidVotes: number;
  totalDiscardedComments: number;
  totalRepeatedComments: number;
  totalFacebookVotes: number;
  totalInstagramVotes: number;
  leader: {
    id: string;
    name: string;
    totalVotes: number;
    photoUrl?: string | null;
  } | null;
  candidatesRanking: Array<{
    id: string;
    name: string;
    number: number | null;
    photoUrl: string | null;
    bio: string | null;
    status: string;
    facebookVotes: number;
    instagramVotes: number;
    totalVotes: number;
    percentage: number;
    rank: number;
    differenceFromLeader: number;
    isWinner: boolean;
  }>;
  repeatedCommentsSummary: Array<{
    text: string;
    frequency: number;
    candidateName: string | null;
    status: string;
  }>;
  discardReasonsSummary: Record<string, number>;
}

export interface CandidateDetailData {
  candidate: {
    id: string;
    name: string;
    number: number | null;
    photoUrl: string | null;
    bio: string | null;
    status: string;
    aliasList: string[];
    category: {
      id: string;
      name: string;
      edition: string;
      status: string;
    };
  };
  stats: {
    facebookVotes: number;
    instagramVotes: number;
    totalVotes: number;
    percentage: number;
    rank: number;
    differenceFromLeader: number;
    isWinner: boolean;
    totalCommentsReceived: number;
    duplicateCommentsCount: number;
    discardedCount: number;
  };
  horizontalBarData: Array<{
    network: string;
    votos: number;
    fill: string;
  }>;
  timeline: Array<{
    date: string;
    facebook: number;
    instagram: number;
    total: number;
  }>;
  recentComments: Array<{
    id: string;
    commentId: string;
    author: string;
    text: string;
    platform: string;
    date: string;
    status: string;
    discardReason: string | null;
  }>;
}

export interface VotingDashboardData {
  totalCategories: number;
  totalCandidates: number;
  totalCommentsReceived: number;
  totalValidVotes: number;
  totalRepeatedComments: number;
  totalFacebookVotes: number;
  totalInstagramVotes: number;
  topCandidateOverall: {
    id: string;
    name: string;
    totalVotes: number;
    photoUrl?: string | null;
    categoryName: string;
  } | null;
  platformDistribution: {
    facebook: { count: number; percentage: number };
    instagram: { count: number; percentage: number };
  };
  categories: Array<{
    id: string;
    name: string;
    edition: string;
    status: string;
    votingPolicy: string;
    candidatesCount: number;
    totalVotes: number;
    leader: {
      id: string;
      name: string;
      totalVotes: number;
      photoUrl?: string | null;
    } | null;
    topCandidates: Array<{
      id: string;
      name: string;
      totalVotes: number;
      photoUrl?: string | null;
    }>;
  }>;
}

export interface VotingCommentItem {
  id: string;
  text: string;
  authorName: string;
  platform: 'FACEBOOK' | 'INSTAGRAM';
  commentDate: string;
  postTitle: string;
  categoryName: string;
  voteRecordId: string | null;
  voteStatus: string;
  candidate: { id: string; name: string; number: number | null } | null;
  discardReason: string | null;
  manualNotes: string | null;
}

