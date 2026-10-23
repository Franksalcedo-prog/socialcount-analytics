import fs from 'node:fs';
import path from 'node:path';

const target = process.argv[2]?.toLowerCase();
if (target !== 'sqlite' && target !== 'postgresql') {
  console.error('Uso: tsx scripts/switch-db.ts <sqlite|postgresql>');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

if (target === 'sqlite') {
  schemaContent = schemaContent.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  console.log('✅ Prisma configurado para SQLite (desarrollo local).');
} else {
  schemaContent = schemaContent.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  console.log('✅ Prisma configurado para PostgreSQL (producción).');
}

fs.writeFileSync(schemaPath, schemaContent, 'utf8');
