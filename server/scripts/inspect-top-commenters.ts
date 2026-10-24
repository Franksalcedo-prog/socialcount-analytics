import { prisma } from '../src/db/prisma.js';

async function main() {
  const posts = await prisma.socialPost.findMany({
    include: {
      comments: true,
      socialAccount: true,
    },
    orderBy: { publishedAt: 'desc' },
  });

  console.log(`=== ENCONTRADAS ${posts.length} PUBLICACIONES ===\n`);

  for (const post of posts) {
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`📌 Publicación ID: ${post.id}`);
    console.log(`📱 Plataforma: ${post.platform} | Cuenta: ${post.socialAccount?.name || 'N/A'}`);
    console.log(`📅 Fecha: ${post.publishedAt.toISOString()}`);
    console.log(`📝 Texto: "${post.message || 'Sin texto'}"`);
    console.log(`💬 Comentarios registrados: ${post.comments.length}`);

    const authorCounts: Record<string, number> = {};
    const mentionCounts: Record<string, number> = {};
    const mentionRegex = /@([a-zA-Z0-9._]+)/g;

    for (const c of post.comments) {
      if (c.authorName) {
        authorCounts[c.authorName] = (authorCounts[c.authorName] || 0) + 1;
      }
      let match;
      while ((match = mentionRegex.exec(c.text)) !== null) {
        const handle = `@${match[1]}`;
        mentionCounts[handle] = (mentionCounts[handle] || 0) + 1;
      }
    }

    const sortedAuthors = Object.entries(authorCounts).sort((a, b) => b[1] - a[1]);
    const sortedMentions = Object.entries(mentionCounts).sort((a, b) => b[1] - a[1]);

    if (sortedAuthors.length > 0) {
      console.log(`👤 Comentarista más activo (Persona con más comentarios): ${sortedAuthors[0][0]} (${sortedAuthors[0][1]} comentarios)`);
    } else {
      console.log(`👤 Comentarista más activo: Ninguno`);
    }

    if (sortedMentions.length > 0) {
      console.log(`🏷️ Persona más mencionada / etiquetada: ${sortedMentions[0][0]} (${sortedMentions[0][1]} menciones)`);
    } else {
      console.log(`🏷️ Persona más mencionada: Ninguna mención @ registrada`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
