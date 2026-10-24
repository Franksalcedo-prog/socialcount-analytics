-- ==============================================================================
-- SCHEMA POSTGRESQL PARA SUPABASE
-- Proyecto: wsszgtzsznrobjlwcnny (SocialCount Analytics)
-- Puedes copiar y pegar todo este script directamente en:
-- https://supabase.com/dashboard/project/wsszgtzsznrobjlwcnny/sql
-- ==============================================================================

-- 1. Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla social_accounts
CREATE TABLE IF NOT EXISTS "social_accounts" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL, -- 'FACEBOOK' | 'INSTAGRAM'
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "profilePictureUrl" TEXT,
    "encryptedAccessToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "tokenStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "isMonitored" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "uniq_platform_externalId" UNIQUE ("platform", "externalId")
);

CREATE INDEX IF NOT EXISTS "idx_accounts_user" ON "social_accounts"("userId");
CREATE INDEX IF NOT EXISTS "idx_accounts_platform" ON "social_accounts"("platform");
CREATE INDEX IF NOT EXISTS "idx_accounts_tokenStatus" ON "social_accounts"("tokenStatus");

-- 4. Tabla social_posts
CREATE TABLE IF NOT EXISTS "social_posts" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "socialAccountId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "permalink" TEXT,
    "message" TEXT,
    "mediaType" TEXT,
    "mediaUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "apiCommentsCount" INTEGER NOT NULL DEFAULT 0,
    "repliesCount" INTEGER NOT NULL DEFAULT 0,
    "totalStoredComments" INTEGER NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_account_post" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE,
    CONSTRAINT "uniq_post_platform_externalId" UNIQUE ("platform", "externalId")
);

CREATE INDEX IF NOT EXISTS "idx_posts_account" ON "social_posts"("socialAccountId");
CREATE INDEX IF NOT EXISTS "idx_posts_platform" ON "social_posts"("platform");
CREATE INDEX IF NOT EXISTS "idx_posts_publishedAt" ON "social_posts"("publishedAt");

-- 5. Tabla social_comments
CREATE TABLE IF NOT EXISTS "social_comments" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "postId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "authorName" TEXT,
    "authorExternalId" TEXT,
    "authorProfilePic" TEXT,
    "text" TEXT NOT NULL,
    "commentDate" TIMESTAMP(3) NOT NULL,
    "isReply" BOOLEAN NOT NULL DEFAULT false,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_post_comment" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_account_comment" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE,
    CONSTRAINT "uniq_comment_platform_externalId" UNIQUE ("platform", "externalId")
);

CREATE INDEX IF NOT EXISTS "idx_comments_post" ON "social_comments"("postId");
CREATE INDEX IF NOT EXISTS "idx_comments_account" ON "social_comments"("socialAccountId");
CREATE INDEX IF NOT EXISTS "idx_comments_platform" ON "social_comments"("platform");
CREATE INDEX IF NOT EXISTS "idx_comments_commentDate" ON "social_comments"("commentDate");
CREATE INDEX IF NOT EXISTS "idx_comments_parent" ON "social_comments"("parentCommentId");
CREATE INDEX IF NOT EXISTS "idx_comments_isReply" ON "social_comments"("isReply");

-- 6. Tabla sync_jobs
CREATE TABLE IF NOT EXISTS "sync_jobs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "socialAccountId" TEXT,
    "triggerSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "postsProcessed" INTEGER NOT NULL DEFAULT 0,
    "commentsFetched" INTEGER NOT NULL DEFAULT 0,
    "commentsAdded" INTEGER NOT NULL DEFAULT 0,
    "commentsUpdated" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_account_job" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_sync_status" ON "sync_jobs"("status");
CREATE INDEX IF NOT EXISTS "idx_sync_startedAt" ON "sync_jobs"("startedAt");

-- 7. Tabla sync_logs
CREATE TABLE IF NOT EXISTS "sync_logs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "syncJobId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_job_logs" FOREIGN KEY ("syncJobId") REFERENCES "sync_jobs"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_logs_job" ON "sync_logs"("syncJobId");
CREATE INDEX IF NOT EXISTS "idx_logs_level" ON "sync_logs"("level");

-- 8. Tabla audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_user_audit" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_audit_user" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "idx_audit_action" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "idx_audit_created" ON "audit_logs"("createdAt");

-- 9. Tabla categories (Convocatorias y Categorías de Ébano)
CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "edition" TEXT NOT NULL DEFAULT '2026',
    "description" TEXT,
    "votingPolicy" TEXT NOT NULL DEFAULT 'ONE_PER_USER_AND_CANDIDATE',
    "status" TEXT NOT NULL DEFAULT 'PROVISIONAL',
    "allowMultipleMentions" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Agregar categoryId a social_posts
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'categoryId') THEN
        ALTER TABLE "social_posts" ADD COLUMN "categoryId" TEXT;
        ALTER TABLE "social_posts" ADD CONSTRAINT "fk_post_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL;
        CREATE INDEX "idx_post_category" ON "social_posts"("categoryId");
    END IF;
END $$;

-- 10. Tabla candidates (Integrantes participantes)
CREATE TABLE IF NOT EXISTS "candidates" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER,
    "aliasList" TEXT NOT NULL DEFAULT '[]',
    "photoUrl" TEXT,
    "bio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_candidate_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_candidate_category" ON "candidates"("categoryId");

-- 11. Tabla vote_records (Auditoría granular de comentarios/votos)
CREATE TABLE IF NOT EXISTS "vote_records" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "commentId" TEXT UNIQUE NOT NULL,
    "candidateId" TEXT,
    "normalizedText" TEXT NOT NULL,
    "textHash" TEXT NOT NULL,
    "voteStatus" TEXT NOT NULL,
    "discardReason" TEXT,
    "manualNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_vote_comment" FOREIGN KEY ("commentId") REFERENCES "social_comments"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_vote_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_vote_candidate" ON "vote_records"("candidateId");
CREATE INDEX IF NOT EXISTS "idx_vote_status" ON "vote_records"("voteStatus");
CREATE INDEX IF NOT EXISTS "idx_vote_hash" ON "vote_records"("textHash");

-- 12. Tabla vote_audit_logs (Trazabilidad de modificaciones manuales de votos)
CREATE TABLE IF NOT EXISTS "vote_audit_logs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "voteRecordId" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "previousCandidateId" TEXT,
    "newCandidateId" TEXT,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_audit_vote" FOREIGN KEY ("voteRecordId") REFERENCES "vote_records"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_audit_voteRecord" ON "vote_audit_logs"("voteRecordId");

