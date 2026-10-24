import { prisma } from '../db/prisma.js';
import { seedEbanoVotingDataIfNeeded } from './ebano-voting-seed.service.js';

/**
 * Servicio de Auto-Migración de Base de Datos para Producción (Supabase / PostgreSQL)
 * Permite que Vercel ejecute automáticamente las sentencias DDL faltantes y
 * estandarice los nombres de columna en camelCase requeridos por Prisma.
 */
class SchemaMigrationService {
  private migrated = false;

  public async ensureTablesExist(): Promise<{ success: boolean; message: string; applied: string[] }> {
    if (this.migrated) {
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
      console.log('🔍 Verificando y sincronizando esquema en Supabase PostgreSQL...');

      // 1. Estandarizar columnas a camelCase en tablas base existentes si estaban en minúsculas
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          -- social_accounts
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_accounts' AND column_name = 'externalid') THEN
            ALTER TABLE social_accounts RENAME COLUMN externalid TO "externalId";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_accounts' AND column_name = 'userid') THEN
            ALTER TABLE social_accounts RENAME COLUMN userid TO "userId";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_accounts' AND column_name = 'profilepictureurl') THEN
            ALTER TABLE social_accounts RENAME COLUMN profilepictureurl TO "profilePictureUrl";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_accounts' AND column_name = 'encryptedaccesstoken') THEN
            ALTER TABLE social_accounts RENAME COLUMN encryptedaccesstoken TO "encryptedAccessToken";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_accounts' AND column_name = 'tokenexpiresat') THEN
            ALTER TABLE social_accounts RENAME COLUMN tokenexpiresat TO "tokenExpiresAt";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_accounts' AND column_name = 'tokenstatus') THEN
            ALTER TABLE social_accounts RENAME COLUMN tokenstatus TO "tokenStatus";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_accounts' AND column_name = 'ismonitored') THEN
            ALTER TABLE social_accounts RENAME COLUMN ismonitored TO "isMonitored";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_accounts' AND column_name = 'lastsyncat') THEN
            ALTER TABLE social_accounts RENAME COLUMN lastsyncat TO "lastSyncAt";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_accounts' AND column_name = 'createdat') THEN
            ALTER TABLE social_accounts RENAME COLUMN createdat TO "createdAt";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_accounts' AND column_name = 'updatedat') THEN
            ALTER TABLE social_accounts RENAME COLUMN updatedat TO "updatedAt";
          END IF;

          -- social_posts
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'socialaccountid') THEN
            ALTER TABLE social_posts RENAME COLUMN socialaccountid TO "socialAccountId";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'externalid') THEN
            ALTER TABLE social_posts RENAME COLUMN externalid TO "externalId";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'mediatype') THEN
            ALTER TABLE social_posts RENAME COLUMN mediatype TO "mediaType";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'mediaurl') THEN
            ALTER TABLE social_posts RENAME COLUMN mediaurl TO "mediaUrl";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'publishedat') THEN
            ALTER TABLE social_posts RENAME COLUMN publishedat TO "publishedAt";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'apicommentscount') THEN
            ALTER TABLE social_posts RENAME COLUMN apicommentscount TO "apiCommentsCount";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'repliescount') THEN
            ALTER TABLE social_posts RENAME COLUMN repliescount TO "repliesCount";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'totalstoredcomments') THEN
            ALTER TABLE social_posts RENAME COLUMN totalstoredcomments TO "totalStoredComments";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'lastsyncedat') THEN
            ALTER TABLE social_posts RENAME COLUMN lastsyncedat TO "lastSyncedAt";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'rawdata') THEN
            ALTER TABLE social_posts RENAME COLUMN rawdata TO "rawData";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'categoryid') THEN
            ALTER TABLE social_posts RENAME COLUMN categoryid TO "categoryId";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'createdat') THEN
            ALTER TABLE social_posts RENAME COLUMN createdat TO "createdAt";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'updatedat') THEN
            ALTER TABLE social_posts RENAME COLUMN updatedat TO "updatedAt";
          END IF;

          -- social_comments
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'postid') THEN
            ALTER TABLE social_comments RENAME COLUMN postid TO "postId";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'externalid') THEN
            ALTER TABLE social_comments RENAME COLUMN externalid TO "externalId";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'parentcommentid') THEN
            ALTER TABLE social_comments RENAME COLUMN parentcommentid TO "parentCommentId";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'authorid') THEN
            ALTER TABLE social_comments RENAME COLUMN authorid TO "authorId";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'authorname') THEN
            ALTER TABLE social_comments RENAME COLUMN authorname TO "authorName";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'authorusername') THEN
            ALTER TABLE social_comments RENAME COLUMN authorusername TO "authorUsername";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'commentdate') THEN
            ALTER TABLE social_comments RENAME COLUMN commentdate TO "commentDate";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'likecount') THEN
            ALTER TABLE social_comments RENAME COLUMN likecount TO "likeCount";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'replycount') THEN
            ALTER TABLE social_comments RENAME COLUMN replycount TO "replyCount";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'rawdata') THEN
            ALTER TABLE social_comments RENAME COLUMN rawdata TO "rawData";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'createdat') THEN
            ALTER TABLE social_comments RENAME COLUMN createdat TO "createdAt";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_comments' AND column_name = 'updatedat') THEN
            ALTER TABLE social_comments RENAME COLUMN updatedat TO "updatedAt";
          END IF;

          -- users
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'passwordhash') THEN
            ALTER TABLE users RENAME COLUMN passwordhash TO "passwordHash";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatarurl') THEN
            ALTER TABLE users RENAME COLUMN avatarurl TO "avatarUrl";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'createdat') THEN
            ALTER TABLE users RENAME COLUMN createdat TO "createdAt";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updatedat') THEN
            ALTER TABLE users RENAME COLUMN updatedat TO "updatedAt";
          END IF;
        END $$;
      `);
      applied.push('column_casing_standardized');

      // 2. Crear tabla categories
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

      // 3. Crear tabla candidates
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

      // 4. Crear tabla vote_records
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

      // 5. Crear tabla vote_audit_logs
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

      // 6. Añadir columna categoryId a social_posts
      await prisma.$executeRawUnsafe(`
        ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS "categoryId" TEXT REFERENCES categories(id) ON DELETE SET NULL;
      `);
      applied.push('social_posts.categoryId');

      // 7. Índices de aceleración
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_candidates_category_id ON candidates("categoryId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vote_records_candidate_id ON vote_records("candidateId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vote_records_status ON vote_records("voteStatus");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vote_records_text_hash ON vote_records("textHash");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vote_audit_vote_id ON vote_audit_logs("voteRecordId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_social_posts_category_id ON social_posts("categoryId");`);
      applied.push('indexes');

      // 8. Auto-población de datos si categories está vacío
      const count = await prisma.category.count();
      if (count === 0) {
        console.log('🌱 Base de datos vacía en Supabase. Ejecutando seed de Convocatoria Ébano...');
        const seedResult = await seedEbanoVotingDataIfNeeded();
        applied.push(`seed: ${seedResult.message}`);
      }

      this.migrated = true;
      console.log('✅ Auto-migración en Supabase completada con éxito.');
      return {
        success: true,
        message: 'Esquema de Supabase actualizado correctamente con todas las tablas e índices de votación.',
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
