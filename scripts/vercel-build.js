import { execSync } from 'node:child_process';

console.log('🚀 Iniciando Vercel Build Pipeline...');

// Asegurar variable DATABASE_URL para que Prisma genere el cliente sin fallar
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:dummy@localhost:5432/postgres';
}

console.log('📦 1. Configurando Prisma para PostgreSQL...');
execSync('npm run db:use-postgres --workspace=server', { stdio: 'inherit' });

console.log('⚙️ 2. Generando cliente de Prisma...');
execSync('npm run db:generate --workspace=server', { stdio: 'inherit' });

console.log('🖥️ 3. Compilando aplicación Frontend (Vite)...');
execSync('npm run build --workspace=client', { stdio: 'inherit' });

console.log('✨ Build completado exitosamente para Vercel.');
