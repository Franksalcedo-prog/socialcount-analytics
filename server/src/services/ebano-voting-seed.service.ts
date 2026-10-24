import { prisma } from '../db/prisma.js';
import { voteEngineService } from './vote-engine.service.js';
import { seedDemoDataIfNeeded } from './demo-data.service.js';

export async function seedEbanoVotingDataIfNeeded(): Promise<{ seeded: boolean; message: string }> {
  const existingCategories = await prisma.category.count();
  if (existingCategories > 0) {
    return { seeded: false, message: 'Categorías de votación ya inicializadas.' };
  }

  // 1. Obtener cuentas y posts existentes (crearlas si no existen)
  let fbAccount = await prisma.socialAccount.findFirst({ where: { platform: 'FACEBOOK' } });
  let igAccount = await prisma.socialAccount.findFirst({ where: { platform: 'INSTAGRAM' } });

  if (!fbAccount || !igAccount) {
    await seedDemoDataIfNeeded();
    fbAccount = await prisma.socialAccount.findFirst({ where: { platform: 'FACEBOOK' } });
    igAccount = await prisma.socialAccount.findFirst({ where: { platform: 'INSTAGRAM' } });
  }

  if (!fbAccount || !igAccount) {
    return { seeded: false, message: 'Se requieren cuentas de Facebook e Instagram para inicializar votaciones.' };
  }

  // 2. Crear Categoría 1: Reina Ébano 2026
  const catReina = await prisma.category.create({
    data: {
      name: 'Reina Ébano 2026',
      slug: 'reina-ebano-2026',
      edition: 'Convocatoria Oficial 2026',
      description: 'Elección popular de la embajadora cultural y social Ébano 2026 a través de votos verificados en redes sociales.',
      votingPolicy: 'ONE_PER_USER_AND_CANDIDATE',
      status: 'PROVISIONAL',
      allowMultipleMentions: false,
    },
  });

  // Integrantes Categoría Reina
  const cand1 = await prisma.candidate.create({
    data: {
      categoryId: catReina.id,
      name: 'Valentina Córdoba',
      number: 1,
      aliasList: JSON.stringify(['#valentina', '@valentina_cordoba', 'valentina', 'candidata 1', 'valentina cordoba']),
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'Representante de Quibdó. Diseñadora de modas y defensora del patrimonio textil afrocolombiano.',
      status: 'ACTIVE',
    },
  });

  const cand2 = await prisma.candidate.create({
    data: {
      categoryId: catReina.id,
      name: 'Isabella Mina',
      number: 2,
      aliasList: JSON.stringify(['#isabella', '@isabella_mina', 'isabella', 'candidata 2', 'isabella mina']),
      photoUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
      bio: 'Representante de Cali. Comunicadora social y líder de proyectos juveniles de inclusión.',
      status: 'ACTIVE',
    },
  });

  const cand3 = await prisma.candidate.create({
    data: {
      categoryId: catReina.id,
      name: 'Mayra Lucumí',
      number: 3,
      aliasList: JSON.stringify(['#mayra', '@mayra_lucumi', 'mayra', 'candidata 3', 'mayra lucumi']),
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
      bio: 'Representante de Buenaventura. Emprendedora comunitaria y bailarina de danzas tradicionales.',
      status: 'ACTIVE',
    },
  });

  const cand4 = await prisma.candidate.create({
    data: {
      categoryId: catReina.id,
      name: 'Dayana Riascos',
      number: 4,
      aliasList: JSON.stringify(['#dayana', '@dayana_riascos', 'dayana', 'candidata 4', 'dayana riascos']),
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      bio: 'Representante de Tumaco. Estudiante de derecho y ambientalista costera.',
      status: 'ACTIVE',
    },
  });

  // 3. Crear Categoría 2: Emprendimiento Ébano 2026
  const catEmp = await prisma.category.create({
    data: {
      name: 'Emprendimiento Ébano 2026',
      slug: 'emprendimiento-ebano-2026',
      edition: 'Convocatoria Oficial 2026',
      description: 'Reconocimiento a los emprendimientos sostenibles con mayor respaldo comunitario.',
      votingPolicy: 'ONE_PER_USER_PER_CATEGORY', // Regla estricta: 1 voto por usuario en la categoría
      status: 'PROVISIONAL',
      allowMultipleMentions: false,
    },
  });

  await prisma.candidate.createMany({
    data: [
      {
        categoryId: catEmp.id,
        name: 'Artesanías Chocó Afro',
        number: 1,
        aliasList: JSON.stringify(['artesanias choco', '#artesanias', 'artesanias', 'candidata 1', 'choco afro']),
        photoUrl: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=400&auto=format&fit=crop&q=80',
        bio: 'Joyería y artesanías en filigrana y fibras naturales de la selva chocoana.',
        status: 'ACTIVE',
      },
      {
        categoryId: catEmp.id,
        name: 'Moda Étnica Ancestral',
        number: 2,
        aliasList: JSON.stringify(['moda etnica', '#modaetnica', 'etnica ancestral', 'candidata 2']),
        photoUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format&fit=crop&q=80',
        bio: 'Prendas con estampados botánicos y tintes naturales del Pacífico.',
        status: 'ACTIVE',
      },
      {
        categoryId: catEmp.id,
        name: 'Bebidas Típicas del Pacífico',
        number: 3,
        aliasList: JSON.stringify(['bebidas tipicas', '#viche', 'viche pacifico', 'candidata 3', 'bebidas']),
        photoUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80',
        bio: 'Destilados tradicionales y transformaciones agroindustriales del viche.',
        status: 'ACTIVE',
      },
    ],
  });

  // 4. Crear Publicaciones Oficiales vinculadas a la Categoría Reina
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const postFbReina = await prisma.socialPost.create({
    data: {
      socialAccountId: fbAccount.id,
      platform: 'FACEBOOK',
      externalId: 'ebano_post_fb_reina_2026',
      permalink: 'https://facebook.com/ebanomodaoficial/posts/reina2026',
      message: '👑 ¡GRAN VOTACIÓN OFICIAL: REINA ÉBANO 2026! 👑 Vota por tu candidata favorita comentando su nombre o número: 1. Valentina Córdoba | 2. Isabella Mina | 3. Mayra Lucumí | 4. Dayana Riascos.',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(now - 3 * day),
      categoryId: catReina.id,
      apiCommentsCount: 65,
      repliesCount: 0,
      totalStoredComments: 0,
    },
  });

  const postIgReina = await prisma.socialPost.create({
    data: {
      socialAccountId: igAccount.id,
      platform: 'INSTAGRAM',
      externalId: 'ebano_post_ig_reina_2026',
      permalink: 'https://instagram.com/p/reina_ebano_2026',
      message: '✨ Convocatoria Reina Ébano 2026 ✨ ¡Tu comentario es tu voto! Menciona o escribe el hashtag de tu participante preferida. Votaciones abiertas hasta fin de mes.',
      mediaType: 'CAROUSEL_ALBUM',
      mediaUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(now - 3 * day),
      categoryId: catReina.id,
      apiCommentsCount: 75,
      repliesCount: 0,
      totalStoredComments: 0,
    },
  });

  // 5. Inyectar Comentarios de Votación Realistas (Votos válidos, repetidos spam, duplicados de usuario y multi-mención)
  const votesScenario = [
    // --- VOTOS FACEBOOK PARA REINA ---
    // Valentina: 12 votos válidos, 2 duplicados del mismo usuario
    { post: postFbReina, author: 'Carlos Mendoza', text: 'Mi voto es para Valentina Córdoba #1!', userKey: 'u_fb_1' },
    { post: postFbReina, author: 'Carlos Mendoza', text: 'Valentina Córdoba tiene que ganar!', userKey: 'u_fb_1' }, // DUPLICATE_USER
    { post: postFbReina, author: 'Elena Torres', text: 'Totalmente con Valentina Córdoba, elegancia total', userKey: 'u_fb_2' },
    { post: postFbReina, author: 'Roberto Gómez', text: 'Voto por la candidata 1 Valentina', userKey: 'u_fb_3' },
    { post: postFbReina, author: 'Camila Morales', text: '#valentina cordoba la mejor opción', userKey: 'u_fb_4' },
    { post: postFbReina, author: 'Felipe Reyes', text: 'Valentina Córdoba sin duda alguna', userKey: 'u_fb_5' },
    { post: postFbReina, author: 'Giselle Castro', text: 'Apoyo incondicional a Valentina', userKey: 'u_fb_6' },
    { post: postFbReina, author: 'Jorge Navarro', text: 'Mi voto seguro para Valentina Córdoba', userKey: 'u_fb_7' },
    { post: postFbReina, author: 'Lucas Herrera', text: 'Voto por la numero 1', userKey: 'u_fb_8' },
    { post: postFbReina, author: 'Paola Silva', text: 'Valentina Córdoba reina indiscutible', userKey: 'u_fb_9' },
    { post: postFbReina, author: 'Andrés Hurtado', text: '1. Valentina Córdoba', userKey: 'u_fb_10' },
    { post: postFbReina, author: 'Mónica Rentería', text: '#valentina para reina', userKey: 'u_fb_11' },
    { post: postFbReina, author: 'David Mosquera', text: 'Valentina Córdoba con orgullo chocoano', userKey: 'u_fb_12' },

    // Isabella: 8 votos válidos FB
    { post: postFbReina, author: 'Valeria Rivas', text: 'Isabella Mina merece la corona, liderazgo puro!', userKey: 'u_fb_20' },
    { post: postFbReina, author: 'Patricia Lifestyle', text: 'Voto por Isabella Mina #2', userKey: 'u_fb_21' },
    { post: postFbReina, author: 'Santiago Caicedo', text: 'Isabella Mina es la indicada', userKey: 'u_fb_22' },
    { post: postFbReina, author: 'Lucía Gourmet', text: 'Candidata 2 Isabella Mina', userKey: 'u_fb_23' },
    { post: postFbReina, author: 'Mariana Martínez', text: 'Isabella Mina cuenta con mi voto', userKey: 'u_fb_24' },
    { post: postFbReina, author: 'Esteban Arq', text: '#isabella reina 2026', userKey: 'u_fb_25' },
    { post: postFbReina, author: 'Claudia Arce', text: 'Isabella Mina por siempre', userKey: 'u_fb_26' },
    { post: postFbReina, author: 'Germán Perea', text: 'Isabella Mina es la reina', userKey: 'u_fb_27' },

    // Mayra: 6 votos válidos FB
    { post: postFbReina, author: 'Ignacio Fuentes', text: 'Mayra Lucumí, orgullo del Pacífico! Voto #3', userKey: 'u_fb_30' },
    { post: postFbReina, author: 'Marina Salgado', text: 'Voto por Mayra Lucumí', userKey: 'u_fb_31' },
    { post: postFbReina, author: 'Daniela Prieto', text: '#mayra reina Ébano', userKey: 'u_fb_32' },
    { post: postFbReina, author: 'Óscar Viveros', text: 'Mayra Lucumí la mejor representante', userKey: 'u_fb_33' },
    { post: postFbReina, author: 'Tatiana Bonilla', text: 'Candidata 3 Mayra Lucumí', userKey: 'u_fb_34' },
    { post: postFbReina, author: 'Héctor Balanta', text: 'Mayra Lucumí tiene mi voto', userKey: 'u_fb_35' },

    // Dayana: 4 votos válidos FB
    { post: postFbReina, author: 'Sebastián Quiñones', text: 'Dayana Riascos por Tumaco! Voto 4', userKey: 'u_fb_40' },
    { post: postFbReina, author: 'Yolanda Cuero', text: '#dayana candidata 4', userKey: 'u_fb_41' },
    { post: postFbReina, author: 'Raúl Angulo', text: 'Dayana Riascos eres la ganadora', userKey: 'u_fb_42' },
    { post: postFbReina, author: 'Liliana Tenorio', text: 'Voto por Dayana Riascos', userKey: 'u_fb_43' },

    // Casos especiales FB:
    { post: postFbReina, author: 'Usuario Indeciso', text: 'Apoyo tanto a Valentina como a Isabella, ambas geniales!', userKey: 'u_fb_50' }, // MULTI_MENTION
    { post: postFbReina, author: 'Comentario Spam', text: 'Excelente evento felicidades a todos!', userKey: 'u_fb_51' }, // NO_CANDIDATE_MATCH
    { post: postFbReina, author: 'Bot Repetidor', text: 'Voto voto voto voto', userKey: 'u_fb_52' }, // NO_CANDIDATE_MATCH

    // --- VOTOS INSTAGRAM PARA REINA ---
    // Valentina: 10 votos válidos IG
    { post: postIgReina, author: 'sofia.design', text: '@valentina_cordoba eres la ganadora definitiva! #valentina', userKey: 'u_ig_1' },
    { post: postIgReina, author: 'mateo_vallejo', text: 'Votando por @valentina_cordoba 🤎', userKey: 'u_ig_2' },
    { post: postIgReina, author: 'carolina.vogue', text: '#valentina la mejor propuesta estética', userKey: 'u_ig_3' },
    { post: postIgReina, author: 'andrea_paz', text: 'Valentina Córdoba reina indiscutible', userKey: 'u_ig_4' },
    { post: postIgReina, author: 'felipe_r', text: 'Candidata 1 Valentina!', userKey: 'u_ig_5' },
    { post: postIgReina, author: 'giselle_c', text: '@valentina_cordoba sin duda', userKey: 'u_ig_6' },
    { post: postIgReina, author: 'jorge_nav', text: '#valentina mi voto', userKey: 'u_ig_7' },
    { post: postIgReina, author: 'paola_s', text: 'Valentina Córdoba ❤️', userKey: 'u_ig_8' },
    { post: postIgReina, author: 'lucas_h', text: 'Voto por la 1 Valentina', userKey: 'u_ig_9' },
    { post: postIgReina, author: 'carlos_m', text: '@valentina_cordoba a ganar!', userKey: 'u_ig_10' },

    // Isabella: 11 votos válidos IG (Fuerte en Instagram!)
    { post: postIgReina, author: 'isabella_fan_club', text: 'Todas con @isabella_mina #isabella la mejor ✨', userKey: 'u_ig_20' },
    { post: postIgReina, author: 'isabella_fan_club', text: 'Todas con @isabella_mina #isabella la mejor ✨', userKey: 'u_ig_20' }, // REPEATED_TEXT / DUPLICATE
    { post: postIgReina, author: 'cali_fashion', text: 'Isabella Mina reina 2026', userKey: 'u_ig_21' },
    { post: postIgReina, author: 'valle_afro', text: '@isabella_mina candidata 2 mi voto', userKey: 'u_ig_22' },
    { post: postIgReina, author: 'diana_style', text: '#isabella mina reina!', userKey: 'u_ig_23' },
    { post: postIgReina, author: 'kevin_beat', text: 'Votando por Isabella Mina', userKey: 'u_ig_24' },
    { post: postIgReina, author: 'laura_model', text: '@isabella_mina cuenta conmigo', userKey: 'u_ig_25' },
    { post: postIgReina, author: 'manuel_art', text: 'Isabella Mina #2', userKey: 'u_ig_26' },
    { post: postIgReina, author: 'natalia_trend', text: '#isabella hermosa y talentosa', userKey: 'u_ig_27' },
    { post: postIgReina, author: 'rodrigo_photo', text: 'Isabella Mina tiene mi apoyo', userKey: 'u_ig_28' },
    { post: postIgReina, author: 'ximena_dancer', text: '@isabella_mina la verdadera reina', userKey: 'u_ig_29' },
    { post: postIgReina, author: 'gustavo_pr', text: 'Isabella Mina número 2', userKey: 'u_ig_30' },

    // Mayra: 8 votos válidos IG
    { post: postIgReina, author: 'buenaventura_viva', text: '@mayra_lucumi la corona va para el puerto! #mayra', userKey: 'u_ig_40' },
    { post: postIgReina, author: 'danza_pacifico', text: 'Mayra Lucumí orgullo afro', userKey: 'u_ig_41' },
    { post: postIgReina, author: 'elena_t', text: 'Voto por Mayra Lucumí #3', userKey: 'u_ig_42' },
    { post: postIgReina, author: 'alvaro_mar', text: '@mayra_lucumi es la mejor', userKey: 'u_ig_43' },
    { post: postIgReina, author: 'sonia_costa', text: '#mayra reina', userKey: 'u_ig_44' },
    { post: postIgReina, author: 'camilo_bass', text: 'Candidata 3 Mayra', userKey: 'u_ig_45' },
    { post: postIgReina, author: 'maritza_sun', text: 'Mayra Lucumí con toda!', userKey: 'u_ig_46' },
    { post: postIgReina, author: 'nelson_travel', text: '@mayra_lucumi mi favorita', userKey: 'u_ig_47' },

    // Dayana: 6 votos válidos IG
    { post: postIgReina, author: 'tumaco_lindo', text: '@dayana_riascos digna embajadora! #dayana', userKey: 'u_ig_50' },
    { post: postIgReina, author: 'narino_afro', text: 'Voto por Dayana Riascos número 4', userKey: 'u_ig_51' },
    { post: postIgReina, author: 'pedro_sur', text: '#dayana riascos reina Ébano', userKey: 'u_ig_52' },
    { post: postIgReina, author: 'silvia_playa', text: 'Dayana Riascos la más auténtica', userKey: 'u_ig_53' },
    { post: postIgReina, author: 'jhon_manglar', text: 'Candidata 4 Dayana', userKey: 'u_ig_54' },
    { post: postIgReina, author: 'mercedes_sol', text: '@dayana_riascos éxito total', userKey: 'u_ig_55' },
  ];

  let commentCounter = 1000;
  for (const s of votesScenario) {
    commentCounter++;
    const isFb = s.post.platform === 'FACEBOOK';
    const account = isFb ? fbAccount : igAccount;
    const commentDate = new Date(now - (Math.random() * 2.8 + 0.1) * day);

    await prisma.socialComment.create({
      data: {
        postId: s.post.id,
        socialAccountId: account.id,
        platform: s.post.platform,
        externalId: `seed_vote_${s.post.platform.toLowerCase()}_${commentCounter}`,
        authorName: s.author,
        authorExternalId: s.userKey,
        text: s.text,
        commentDate,
        status: 'VERIFIED',
      },
    });
  }

  // Actualizar conteos de posts
  const fbCount = await prisma.socialComment.count({ where: { postId: postFbReina.id } });
  await prisma.socialPost.update({ where: { id: postFbReina.id }, data: { totalStoredComments: fbCount } });

  const igCount = await prisma.socialComment.count({ where: { postId: postIgReina.id } });
  await prisma.socialPost.update({ where: { id: postIgReina.id }, data: { totalStoredComments: igCount } });

  // 6. Ejecutar el motor de conteo oficial sobre la Categoría Reina
  await voteEngineService.processCategoryVotes(catReina.id);

  return { seeded: true, message: 'Datos y votos de Convocatoria Ébano inicializados con éxito.' };
}
