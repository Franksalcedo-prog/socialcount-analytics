import { prisma } from '../db/prisma.js';
import { seedEbanoVotingDataIfNeeded } from './ebano-voting-seed.service.js';

/**
 * Servicio de Auto-Migración de Base de Datos para Producción (Supabase / PostgreSQL)
 * Permite que Vercel ejecute automáticamente las sentencias DDL faltantes sin necesidad
 * de intervención manual en la consola de Supabase.
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
      console.log('🔍 Verificando esquema en Supabase PostgreSQL...');

      // 1. Crear tabla categories
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

      // 2. Crear tabla candidates
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

      // 3. Crear tabla vote_records
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

      // 4. Crear tabla vote_audit_logs
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

      // 5. Añadir columna categoryId a social_posts
      await prisma.$executeRawUnsafe(`
        ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS "categoryId" TEXT REFERENCES categories(id) ON DELETE SET NULL;
      `);
      applied.push('social_posts.categoryId');

      // 6. Índices de aceleración
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_candidates_category_id ON candidates("categoryId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vote_records_candidate_id ON vote_records("candidateId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vote_records_status ON vote_records("voteStatus");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vote_records_text_hash ON vote_records("textHash");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vote_audit_vote_id ON vote_audit_logs("voteRecordId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_social_posts_category_id ON social_posts("categoryId");`);
      applied.push('indexes');

      // 7. Auto-población de datos si categories está vacío
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
