import { seedDemoDataIfNeeded } from '../src/services/demo-data.service.js';
import { disconnectPrisma } from '../src/db/prisma.js';

async function main() {
  console.log('🌱 Inicializando datos de demostración en SocialCount Analytics...');
  const result = await seedDemoDataIfNeeded();
  console.log(`✨ ${result.message}`);
}

main()
  .catch((e) => {
    console.error('Error durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectPrisma();
  });
