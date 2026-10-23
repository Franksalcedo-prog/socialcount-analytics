import { prisma } from '../db/prisma.js';
import { encryptToken } from './encryption.service.js';

export async function seedDemoDataIfNeeded(): Promise<{ seeded: boolean; message: string }> {
  // Check if any accounts already exist
  const existingAccounts = await prisma.socialAccount.count();
  if (existingAccounts > 0) {
    return { seeded: false, message: 'Datos ya inicializados.' };
  }

  // 1. Create or get default demo user
  let user = await prisma.user.findFirst({ where: { email: 'demo@socialcount.io' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'demo@socialcount.io',
        name: 'Administrador Demo',
        passwordHash: '$2a$10$demoHashedPasswordExample1234567890abcdef',
        role: 'ADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
    });
  }

  // 2. Create Facebook Page Account
  const fbAccount = await prisma.socialAccount.create({
    data: {
      userId: user.id,
      platform: 'FACEBOOK',
      externalId: 'demo_fb_page_1092837465',
      name: 'Ébano Moda & Estilo (Página Oficial)',
      username: 'ebanomodaoficial',
      profilePictureUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&auto=format&fit=crop&q=80',
      encryptedAccessToken: encryptToken('EAAG_DEMO_TOKEN_FACEBOOK_PAGE_LONG_LIVED'),
      tokenExpiresAt: null, // Facebook page access tokens from permanent user tokens don't expire
      tokenStatus: 'ACTIVE',
      permissions: JSON.stringify(['pages_show_list', 'pages_read_engagement', 'pages_read_user_content']),
      isMonitored: true,
      lastSyncAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
    },
  });

  // 3. Create Instagram Business Account
  const igAccount = await prisma.socialAccount.create({
    data: {
      userId: user.id,
      platform: 'INSTAGRAM',
      externalId: 'demo_ig_business_987654321',
      name: 'Ébano Concept Store',
      username: 'ebano_concept',
      profilePictureUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&auto=format&fit=crop&q=80',
      encryptedAccessToken: encryptToken('EAAG_DEMO_TOKEN_INSTAGRAM_GRAPH_API'),
      tokenExpiresAt: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days remaining
      tokenStatus: 'ACTIVE',
      permissions: JSON.stringify(['instagram_basic', 'instagram_manage_comments', 'pages_show_list']),
      isMonitored: true,
      lastSyncAt: new Date(Date.now() - 12 * 60 * 1000), // 12 mins ago
    },
  });

  // 4. Create Facebook Posts
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const fbPost1 = await prisma.socialPost.create({
    data: {
      socialAccountId: fbAccount.id,
      platform: 'FACEBOOK',
      externalId: '1092837465_1001',
      permalink: 'https://facebook.com/ebanomodaoficial/posts/1001',
      message: '✨ Presentamos nuestra Colección Minimal Otoño-Invierno 2026. Tejidos nobles, diseño atemporal y producción consciente. ¿Cuál es tu pieza favorita?',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(now - 1 * day),
      apiCommentsCount: 42,
      repliesCount: 8,
      totalStoredComments: 42,
      lastSyncAt: new Date(now - 15 * 60 * 1000),
    },
  });

  const fbPost2 = await prisma.socialPost.create({
    data: {
      socialAccountId: fbAccount.id,
      platform: 'FACEBOOK',
      externalId: '1092837465_1002',
      permalink: 'https://facebook.com/ebanomodaoficial/posts/1002',
      message: '¿Buscando el balance perfecto entre elegancia y comodidad? Mira estos 3 outfits recomendados para tu jornada laboral híbrida.',
      mediaType: 'VIDEO',
      mediaUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(now - 4 * day),
      apiCommentsCount: 28,
      repliesCount: 5,
      totalStoredComments: 28,
      lastSyncAt: new Date(now - 15 * 60 * 1000),
    },
  });

  const fbPost3 = await prisma.socialPost.create({
    data: {
      socialAccountId: fbAccount.id,
      platform: 'FACEBOOK',
      externalId: '1092837465_1003',
      permalink: 'https://facebook.com/ebanomodaoficial/posts/1003',
      message: 'Pregunta de la semana: Si pudieras elegir una sola prenda versátil para viajar este mes, ¿cuál elegirías?',
      mediaType: 'STATUS',
      mediaUrl: null,
      publishedAt: new Date(now - 8 * day),
      apiCommentsCount: 64,
      repliesCount: 14,
      totalStoredComments: 64,
      lastSyncAt: new Date(now - 15 * 60 * 1000),
    },
  });

  // 5. Create Instagram Posts
  const igPost1 = await prisma.socialPost.create({
    data: {
      socialAccountId: igAccount.id,
      platform: 'INSTAGRAM',
      externalId: '17983472910384756',
      permalink: 'https://instagram.com/p/C8_demo_post_01',
      message: 'Detalles que transforman lo cotidiano. Calidad artesanal en cada costura. 🤎 Envíos nacionales disponibles.',
      mediaType: 'CAROUSEL_ALBUM',
      mediaUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(now - 2 * day),
      apiCommentsCount: 78,
      repliesCount: 19,
      totalStoredComments: 78,
      lastSyncAt: new Date(now - 12 * 60 * 1000),
    },
  });

  const igPost2 = await prisma.socialPost.create({
    data: {
      socialAccountId: igAccount.id,
      platform: 'INSTAGRAM',
      externalId: '17983472910384757',
      permalink: 'https://instagram.com/p/C8_demo_post_02',
      message: 'Sorteo Express 🎉 Queremos premiar a nuestra comunidad con una gift card de $200 USD. Comenta tu color favorito y etiqueta a un amigo.',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(now - 5 * day),
      apiCommentsCount: 185,
      repliesCount: 32,
      totalStoredComments: 185,
      lastSyncAt: new Date(now - 12 * 60 * 1000),
    },
  });

  const igPost3 = await prisma.socialPost.create({
    data: {
      socialAccountId: igAccount.id,
      platform: 'INSTAGRAM',
      externalId: '17983472910384758',
      permalink: 'https://instagram.com/p/C8_demo_post_03',
      message: 'Behind the scenes: así seleccionamos la paleta de tintes orgánicos para la nueva temporada. 🌿✨',
      mediaType: 'VIDEO',
      mediaUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(now - 12 * day),
      apiCommentsCount: 52,
      repliesCount: 9,
      totalStoredComments: 52,
      lastSyncAt: new Date(now - 12 * 60 * 1000),
    },
  });

  // 6. Generate Realistic Comments across posts and days
  const sampleCommentsData = [
    // FB Post 1
    {
      postId: fbPost1.id,
      socialAccountId: fbAccount.id,
      platform: 'FACEBOOK',
      externalId: 'fb_c_101',
      authorName: 'Camila Morales',
      authorExternalId: 'fb_u_01',
      text: '¡El abrigo camel con botones de carey está increíble! ¿Tienen disponible en talla M?',
      daysAgo: 1,
      isReply: false,
      replyCount: 1,
    },
    {
      postId: fbPost1.id,
      socialAccountId: fbAccount.id,
      platform: 'FACEBOOK',
      externalId: 'fb_c_102',
      parentCommentId: 'fb_c_101',
      authorName: 'Ébano Moda & Estilo',
      authorExternalId: 'demo_fb_page_1092837465',
      text: '¡Hola Camila! Sí, tenemos stock en talla M en nuestra boutique y web. Te dejamos mensaje privado con el enlace directo.',
      daysAgo: 0.9,
      isReply: true,
      replyCount: 0,
    },
    {
      postId: fbPost1.id,
      socialAccountId: fbAccount.id,
      platform: 'FACEBOOK',
      externalId: 'fb_c_103',
      authorName: 'Roberto Gómez',
      authorExternalId: 'fb_u_02',
      text: 'Excelente calidad de telas como siempre. El corte de los blazers es impecable.',
      daysAgo: 1,
      isReply: false,
      replyCount: 0,
    },
    {
      postId: fbPost1.id,
      socialAccountId: fbAccount.id,
      platform: 'FACEBOOK',
      externalId: 'fb_c_104',
      authorName: 'Valeria Rivas',
      authorExternalId: 'fb_u_03',
      text: '¿Hacen envíos internacionales a Santiago de Chile?',
      daysAgo: 0.7,
      isReply: false,
      replyCount: 1,
    },
    {
      postId: fbPost1.id,
      socialAccountId: fbAccount.id,
      platform: 'FACEBOOK',
      externalId: 'fb_c_105',
      parentCommentId: 'fb_c_104',
      authorName: 'Ébano Moda & Estilo',
      authorExternalId: 'demo_fb_page_1092837465',
      text: 'Hola Valeria, sí contamos con envíos express vía DHL a todo el Cono Sur.',
      daysAgo: 0.6,
      isReply: true,
      replyCount: 0,
    },

    // IG Post 1
    {
      postId: igPost1.id,
      socialAccountId: igAccount.id,
      platform: 'INSTAGRAM',
      externalId: 'ig_c_201',
      authorName: 'sofia.design',
      authorExternalId: 'ig_u_11',
      text: 'Simplemente obsesionada con los acabados en lino puro 😍👌',
      daysAgo: 2,
      isReply: false,
      replyCount: 1,
    },
    {
      postId: igPost1.id,
      socialAccountId: igAccount.id,
      platform: 'INSTAGRAM',
      externalId: 'ig_c_202',
      parentCommentId: 'ig_c_201',
      authorName: 'ebano_concept',
      authorExternalId: 'demo_ig_business_987654321',
      text: '@sofia.design Muchas gracias Sofi! Trabajamos cada pieza artesanalmente.',
      daysAgo: 1.8,
      isReply: true,
      replyCount: 0,
    },
    {
      postId: igPost1.id,
      socialAccountId: igAccount.id,
      platform: 'INSTAGRAM',
      externalId: 'ig_c_203',
      authorName: 'mateo_vallejo',
      authorExternalId: 'ig_u_12',
      text: 'Precio por favor de la tote bag en cuero marrón?',
      daysAgo: 1.5,
      isReply: false,
      replyCount: 1,
    },
    {
      postId: igPost1.id,
      socialAccountId: igAccount.id,
      platform: 'INSTAGRAM',
      externalId: 'ig_c_204',
      parentCommentId: 'ig_c_203',
      authorName: 'ebano_concept',
      authorExternalId: 'demo_ig_business_987654321',
      text: '@mateo_vallejo Te escribimos al DM con catálogo y precios actualizados ✨',
      daysAgo: 1.4,
      isReply: true,
      replyCount: 0,
    },

    // IG Post 2 (Sorteo - Alta actividad)
    {
      postId: igPost2.id,
      socialAccountId: igAccount.id,
      platform: 'INSTAGRAM',
      externalId: 'ig_c_301',
      authorName: 'lucia_gourmet',
      authorExternalId: 'ig_u_21',
      text: 'Me fascina el terracota! Participando con @andrea.fashionist 🤞❤️',
      daysAgo: 5,
      isReply: false,
      replyCount: 0,
    },
    {
      postId: igPost2.id,
      socialAccountId: igAccount.id,
      platform: 'INSTAGRAM',
      externalId: 'ig_c_302',
      authorName: 'patricia_lifestyle',
      authorExternalId: 'ig_u_22',
      text: 'Verde oliva y arena! Invito a @mariana_martinez a participar ✨',
      daysAgo: 4.8,
      isReply: false,
      replyCount: 0,
    },
    {
      postId: igPost2.id,
      socialAccountId: igAccount.id,
      platform: 'INSTAGRAM',
      externalId: 'ig_c_303',
      authorName: 'esteban_arq',
      authorExternalId: 'ig_u_23',
      text: 'Negro mate definitivo! Gran propuesta estética @ebano_concept',
      daysAgo: 4.2,
      isReply: false,
      replyCount: 0,
    },
    {
      postId: igPost2.id,
      socialAccountId: igAccount.id,
      platform: 'INSTAGRAM',
      externalId: 'ig_c_304',
      authorName: 'carolina.vogue',
      authorExternalId: 'ig_u_24',
      text: 'Participando! Amaría ese blazer oversize en tono crudo 🙌 @claudia.arce',
      daysAgo: 3.9,
      isReply: false,
      replyCount: 0,
    },

    // FB Post 3 (Pregunta comunitaria)
    {
      postId: fbPost3.id,
      socialAccountId: fbAccount.id,
      platform: 'FACEBOOK',
      externalId: 'fb_c_401',
      authorName: 'Ignacio Fuentes',
      authorExternalId: 'fb_u_31',
      text: 'Una buena chaqueta ligera con bolsillos internos. Salva cualquier clima y viaje.',
      daysAgo: 8,
      isReply: false,
      replyCount: 2,
    },
    {
      postId: fbPost3.id,
      socialAccountId: fbAccount.id,
      platform: 'FACEBOOK',
      externalId: 'fb_c_402',
      authorName: 'Marina Salgado',
      authorExternalId: 'fb_u_32',
      text: 'Un pantalón de lino cómodo pero estructurado. Funciona de día y de noche.',
      daysAgo: 7.5,
      isReply: false,
      replyCount: 0,
    },
    {
      postId: fbPost3.id,
      socialAccountId: fbAccount.id,
      platform: 'FACEBOOK',
      externalId: 'fb_c_403',
      authorName: 'Daniela Prieto',
      authorExternalId: 'fb_u_33',
      text: 'Bufanda / foulard de seda modal. Ocupa cero espacio y viste muchísimo.',
      daysAgo: 7.1,
      isReply: false,
      replyCount: 0,
    },
  ];

  // Insert comments with realistic dates
  for (const c of sampleCommentsData) {
    const commentDate = new Date(now - c.daysAgo * day);
    await prisma.socialComment.create({
      data: {
        postId: c.postId,
        socialAccountId: c.socialAccountId,
        platform: c.platform,
        externalId: c.externalId,
        parentCommentId: c.parentCommentId || null,
        authorName: c.authorName,
        authorExternalId: c.authorExternalId,
        text: c.text,
        commentDate,
        isReply: c.isReply,
        replyCount: c.replyCount,
        status: 'VERIFIED',
        capturedAt: new Date(commentDate.getTime() + 10 * 60 * 1000),
      },
    });
  }

  // Generate 50 additional historical comments distributed across the last 30 days
  // to populate rich charts (daily trends, weekly distributions, platform comparisons)
  const usersPool = [
    { name: 'Elena Torres', fbId: 'u_100', igId: 'elena_t' },
    { name: 'Carlos Mendoza', fbId: 'u_101', igId: 'carlos_m' },
    { name: 'Andrea Paz', fbId: 'u_102', igId: 'andrea_paz' },
    { name: 'Felipe Reyes', fbId: 'u_103', igId: 'felipe_r' },
    { name: 'Giselle Castro', fbId: 'u_104', igId: 'giselle_c' },
    { name: 'Jorge Navarro', fbId: 'u_105', igId: 'jorge_nav' },
    { name: 'Paola Silva', fbId: 'u_106', igId: 'paola_s' },
    { name: 'Lucas Herrera', fbId: 'u_107', igId: 'lucas_h' },
  ];

  const phrases = [
    'Me encanta esta propuesta!',
    'Excelente atención en su tienda.',
    'Dónde puedo consultar los horarios de apertura?',
    'Compré hace una semana y el pedido llegó perfecto.',
    'Tienen opciones en otros colores?',
    'Recomendadísimo para regalos especiales.',
    'Espero la próxima colección con ansias.',
    'Tienen descuentos con tarjetas bancarias?',
    'Qué hermosos detalles!',
    'La presentación del paquete es insuperable.',
  ];

  const allPosts = [fbPost1, fbPost2, fbPost3, igPost1, igPost2, igPost3];

  for (let i = 0; i < 50; i++) {
    const post = allPosts[i % allPosts.length];
    const account = post.platform === 'FACEBOOK' ? fbAccount : igAccount;
    const author = usersPool[i % usersPool.length];
    const phrase = phrases[i % phrases.length];
    // Spread across 0 to 28 days ago
    const daysOffset = (i * 0.55) % 28;
    const commentDate = new Date(now - daysOffset * day - (i * 37 * 60 * 1000));
    const isReply = i % 4 === 0;

    await prisma.socialComment.create({
      data: {
        postId: post.id,
        socialAccountId: account.id,
        platform: post.platform,
        externalId: `demo_synth_${post.platform.toLowerCase()}_${i + 500}`,
        parentCommentId: isReply ? `demo_synth_${post.platform.toLowerCase()}_${i + 499}` : null,
        authorName: post.platform === 'FACEBOOK' ? author.name : author.igId,
        authorExternalId: post.platform === 'FACEBOOK' ? author.fbId : author.igId,
        text: `${phrase} (#${i + 1})`,
        commentDate,
        isReply,
        replyCount: 0,
        status: 'VERIFIED',
        capturedAt: new Date(commentDate.getTime() + 15 * 60 * 1000),
      },
    });
  }

  // 7. Create Initial Sync Job and Logs
  const initialJob = await prisma.syncJob.create({
    data: {
      triggerSource: 'MANUAL',
      status: 'COMPLETED',
      startedAt: new Date(now - 15 * 60 * 1000),
      completedAt: new Date(now - 14 * 60 * 1000),
      durationMs: 4820,
      postsProcessed: 6,
      commentsFetched: 449,
      commentsAdded: 68,
      commentsUpdated: 0,
      errorSummary: null,
    },
  });

  await prisma.syncLog.createMany({
    data: [
      {
        syncJobId: initialJob.id,
        level: 'INFO',
        message: 'Iniciando proceso de sincronización para 2 cuentas autorizadas.',
        timestamp: new Date(now - 15 * 60 * 1000),
      },
      {
        syncJobId: initialJob.id,
        level: 'INFO',
        message: 'Página Facebook "Ébano Moda & Estilo": 3 publicaciones inspeccionadas, 134 comentarios reconciliados.',
        timestamp: new Date(now - 14.5 * 60 * 1000),
      },
      {
        syncJobId: initialJob.id,
        level: 'INFO',
        message: 'Instagram Business "ebano_concept": 3 medios procesados, 315 comentarios reconciliados sin duplicados.',
        timestamp: new Date(now - 14.2 * 60 * 1000),
      },
      {
        syncJobId: initialJob.id,
        level: 'INFO',
        message: 'Sincronización completada exitosamente. Total nuevo: 68 comentarios almacenados.',
        timestamp: new Date(now - 14 * 60 * 1000),
      },
    ],
  });

  // 8. Create Audit Log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'ACCOUNT_CONNECTED',
      details: 'Cuentas demo de Facebook Pages e Instagram Business inicializadas.',
      ipAddress: '127.0.0.1',
    },
  });

  return { seeded: true, message: 'Datos de demostración inicializados con éxito.' };
}
