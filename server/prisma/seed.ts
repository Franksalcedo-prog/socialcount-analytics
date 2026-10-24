import { seedDemoDataIfNeeded } from '../src/services/demo-data.service.js';
import { seedEbanoVotingDataIfNeeded } from '../src/services/ebano-voting-seed.service.js';
import { disconnectPrisma } from '../src/db/prisma.js';

async function main() {
  console.log('🌱 Inicializando datos de demostración en SocialCount Analytics...');
  const result = await seedDemoDataIfNeeded();
  console.log(`✨ ${result.message}`);

  console.log('👑 Inicializando datos del Concurso Oficial Ébano 2026...');
  const votingResult = await seedEbanoVotingDataIfNeeded();
  console.log(`✨ ${votingResult.message}`);
}

main()
  .catch((e) => {
    console.error('Error durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectPrisma();
  });
