import { prisma } from '../db/prisma.js';
import { seedEbanoVotingDataIfNeeded } from './ebano-voting-seed.service.js';

/**
 * Servicio de Auto-Migración de Base de Datos para Producción (Supabase / PostgreSQL)
 * Ejecuta de forma 100% autónoma las sentencias DDL para garantizar que todas las tablas,
 * columnas e índices requeridos por Prisma existan en Supabase sin intervención manual.
 */
class SchemaMigrationService {
  private migrated = false;

  public async ensureTablesExist(force = false): Promise<{ success: boolean; message: string; applied: string[] }> {
    if (this.migrated && !force) {
      try {
        const count = await prisma.category.count();
        if (count === 0) {
          await seedEbanoVotingDataIfNeeded();
        }
      } catch {}
      return { success: true, message: 'Migración ya ejecutada previamente en esta instancia.', applied: [] };
    }

    const applied: string[] = [];
    const isPostgres =
      Boolean(process.env.VERCEL) ||
      Boolean(process.env.DATABASE_URL?.startsWith('postgres'));

    if (!isPostgres) {
      this.migrated = true;
      return { success: true, message: 'Entorno SQLite detectado; esquema administrado por Prisma local.', applied: [] };
    }

    try {
      console.log('🔍 Ejecutando auto-migración integral en Supabase PostgreSQL...');

      // 0. Extensión UUID
      await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

      // 1. Tablas Base: users
      await prisma.$executeRawUnsafe(`
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
      `);
      await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;`);
      applied.push('users');

      // 2. Tablas Base: social_accounts
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "social_accounts" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "userId" TEXT NOT NULL,
          "platform" TEXT NOT NULL,
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
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "name" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "username" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "platform" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "externalId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "userId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "encryptedAccessToken" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "profilePictureUrl" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP(3);`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "tokenStatus" TEXT DEFAULT 'ACTIVE';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "permissions" TEXT DEFAULT '[]';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "isMonitored" BOOLEAN DEFAULT true;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
      applied.push('social_accounts');

      // 3. Tablas Base: social_posts
      await prisma.$executeRawUnsafe(`
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
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "socialAccountId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "platform" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "externalId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "permalink" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "message" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "mediaType" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "apiCommentsCount" INTEGER DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "repliesCount" INTEGER DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "totalStoredComments" INTEGER DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
      applied.push('social_posts');

      // 4. Tablas Base: social_comments
      await prisma.$executeRawUnsafe(`
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
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "postId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "socialAccountId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "platform" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "externalId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "parentCommentId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "authorName" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "authorExternalId" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "authorProfilePic" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "text" TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "commentDate" TIMESTAMP(3);`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "isReply" BOOLEAN DEFAULT false;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "replyCount" INTEGER DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'VERIFIED';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "capturedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
      applied.push('social_comments');

      // Sanitizar filas preexistentes que tengan campos requeridos en NULL
      try {
        await prisma.$executeRawUnsafe(`
          UPDATE "users" 
          SET "email" = COALESCE("email", 'admin@ebano.com'),
              "name" = COALESCE("name", 'Administrador Ébano'),
              "passwordHash" = COALESCE("passwordHash", '$2a$10$dummyhash')
          WHERE "email" IS NULL OR "name" IS NULL OR "passwordHash" IS NULL;
        `);
      } catch {}

      try {
        await prisma.$executeRawUnsafe(`
          UPDATE "social_accounts" 
          SET "externalId" = COALESCE("externalId", "id", gen_random_uuid()::text),
              "platform" = COALESCE("platform", 'FACEBOOK'),
              "name" = COALESCE("name", 'Cuenta Ébano'),
              "encryptedAccessToken" = COALESCE("encryptedAccessToken", 'dummy_encrypted_token'),
              "userId" = COALESCE("userId", (SELECT id FROM users LIMIT 1), gen_random_uuid()::text)
          WHERE "externalId" IS NULL OR "platform" IS NULL OR "name" IS NULL OR "encryptedAccessToken" IS NULL OR "userId" IS NULL;
        `);
      } catch {}

      try {
        await prisma.$executeRawUnsafe(`
          UPDATE "social_posts" 
          SET "externalId" = COALESCE("externalId", "id", gen_random_uuid()::text),
              "platform" = COALESCE("platform", 'FACEBOOK'),
              "socialAccountId" = COALESCE("socialAccountId", (SELECT id FROM social_accounts LIMIT 1), gen_random_uuid()::text),
              "publishedAt" = COALESCE("publishedAt", NOW())
          WHERE "externalId" IS NULL OR "platform" IS NULL OR "socialAccountId" IS NULL OR "publishedAt" IS NULL;
        `);
      } catch {}

      try {
        await prisma.$executeRawUnsafe(`
          UPDATE "social_comments" 
          SET "externalId" = COALESCE("externalId", "id", gen_random_uuid()::text),
              "platform" = COALESCE("platform", 'FACEBOOK'),
              "postId" = COALESCE("postId", (SELECT id FROM social_posts LIMIT 1), gen_random_uuid()::text),
              "socialAccountId" = COALESCE("socialAccountId", (SELECT id FROM social_accounts LIMIT 1), gen_random_uuid()::text),
              "text" = COALESCE("text", ''),
              "commentDate" = COALESCE("commentDate", NOW())
          WHERE "externalId" IS NULL OR "platform" IS NULL OR "postId" IS NULL OR "socialAccountId" IS NULL OR "text" IS NULL OR "commentDate" IS NULL;
        `);
      } catch {}

      // 5. Tablas Base: sync_jobs, sync_logs, audit_logs
      await prisma.$executeRawUnsafe(`
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
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "sync_logs" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "syncJobId" TEXT NOT NULL,
          "level" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "metadata" TEXT,
          "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "audit_logs" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "userId" TEXT,
          "action" TEXT NOT NULL,
          "details" TEXT NOT NULL,
          "ipAddress" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      applied.push('sync_jobs_and_logs');

      // 6. Tablas de Votación Ébano: categories
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          edition TEXT NOT NULL DEFAULT '2026',
          description TEXT,
          "votingPolicy" TEXT NOT NULL DEFAULT 'ONE_PER_USER_AND_CANDIDATE',
          status TEXT NOT NULL DEFAULT 'PROVISIONAL',
          "allowMultipleMentions" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      applied.push('categories');

      // 7. Tablas de Votación Ébano: candidates
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS candidates (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "categoryId" TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          number INTEGER,
          "aliasList" TEXT NOT NULL DEFAULT '[]',
          "photoUrl" TEXT,
          bio TEXT,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      applied.push('candidates');

      // 8. Tablas de Votación Ébano: vote_records
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS vote_records (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "commentId" TEXT UNIQUE NOT NULL REFERENCES social_comments(id) ON DELETE CASCADE,
          "candidateId" TEXT REFERENCES candidates(id) ON DELETE SET NULL,
          "normalizedText" TEXT NOT NULL,
          "textHash" TEXT NOT NULL,
          "voteStatus" TEXT NOT NULL,
          "discardReason" TEXT,
          "manualNotes" TEXT,
          "reviewedBy" TEXT,
          "reviewedAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      applied.push('vote_records');

      // 9. Tablas de Votación Ébano: vote_audit_logs
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS vote_audit_logs (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "voteRecordId" TEXT NOT NULL REFERENCES vote_records(id) ON DELETE CASCADE,
          "previousStatus" TEXT NOT NULL,
          "newStatus" TEXT NOT NULL,
          "previousCandidateId" TEXT,
          "newCandidateId" TEXT,
          "changedBy" TEXT NOT NULL,
          reason TEXT NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      applied.push('vote_audit_logs');

      // 10. Vincular foreign key de posts a categories
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE social_posts ADD CONSTRAINT fk_posts_category FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE SET NULL;
        `);
      } catch {
        // Silencioso si la constraint ya existe
      }

      // 11. Índices de aceleración
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_candidates_category_id ON candidates("categoryId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vote_records_candidate_id ON vote_records("candidateId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vote_records_status ON vote_records("voteStatus");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vote_records_text_hash ON vote_records("textHash");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vote_audit_vote_id ON vote_audit_logs("voteRecordId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_social_posts_category_id ON social_posts("categoryId");`);
      applied.push('indexes');

      // 12. Estandarizar cualquier columna que haya quedado en minúsculas en bases existentes
      try {
        await prisma.$executeRawUnsafe(`
          DO $$
          BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_accounts' AND column_name = 'externalid') THEN
              ALTER TABLE social_accounts RENAME COLUMN externalid TO "externalId";
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_accounts' AND column_name = 'userid') THEN
              ALTER TABLE social_accounts RENAME COLUMN userid TO "userId";
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'externalid') THEN
              ALTER TABLE social_posts RENAME COLUMN externalid TO "externalId";
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'socialaccountid') THEN
              ALTER TABLE social_posts RENAME COLUMN socialaccountid TO "socialAccountId";
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'externalid') THEN
              ALTER TABLE social_comments RENAME COLUMN externalid TO "externalId";
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'postid') THEN
              ALTER TABLE social_comments RENAME COLUMN postid TO "postId";
            END IF;
          END $$;
        `);
      } catch {
        // Silencioso
      }

      // 13. Convertir cualquier columna con enum previo a tipo TEXT estándar para compatibilidad con Prisma
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ALTER COLUMN "platform" TYPE TEXT USING "platform"::TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "social_accounts" ALTER COLUMN "tokenStatus" TYPE TEXT USING "tokenStatus"::TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "social_posts" ALTER COLUMN "platform" TYPE TEXT USING "platform"::TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ALTER COLUMN "platform" TYPE TEXT USING "platform"::TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "social_comments" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "sync_jobs" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "sync_jobs" ALTER COLUMN "triggerSource" TYPE TEXT USING "triggerSource"::TEXT;`);
      } catch {}
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "sync_logs" ALTER COLUMN "level" TYPE TEXT USING "level"::TEXT;`);
      } catch {}

      // 14. Auto-población de datos si categories está vacío
      const count = await prisma.category.count();
      if (count === 0) {
        console.log('🌱 Base de datos vacía en Supabase. Ejecutando seed de Convocatoria Ébano...');
        const seedResult = await seedEbanoVotingDataIfNeeded();
        applied.push(`seed: ${seedResult.message}`);
      }

      this.migrated = true;
      console.log('✅ Auto-migración integral en Supabase completada con éxito.');
      return {
        success: true,
        message: 'Esquema de Supabase actualizado y normalizado correctamente con todas las tablas e índices.',
        applied,
      };
    } catch (error: any) {
      console.error('❌ Error durante auto-migración:', error.message);
      return {
        success: false,
        message: `Error al aplicar DDL en Supabase: ${error.message}`,
        applied,
      };
    }
  }
}

export const schemaMigrationService = new SchemaMigrationService();
