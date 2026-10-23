# Plan de Arquitectura e Implementación: SocialCount Analytics

## 1. Visión General del Sistema
**SocialCount Analytics** es una plataforma SaaS profesional de analítica y monitoreo centralizado de comentarios para páginas de Facebook y cuentas profesionales de Instagram. Proporciona:
- Integración segura con Meta Graph API v21.0 (OAuth 2.0, Webhooks, Rate Limiting y Backoff).
- Motor de conteo idempotente con deduplicación por clave compuesta (`[platform, externalId]`) y separación entre comentarios de primer nivel y respuestas.
- Base de datos relacional con Prisma ORM (modelos de usuarios, cuentas sociales, posts, comentarios, trabajos de sincronización, logs y auditoría).
- Cifrado seguro AES-256-GCM para tokens de acceso en reposo.
- Panel de control (Dashboard) con estética SaaS premium, gráficos interactivos con Recharts, animaciones con Motion (`motion/react`), modo demostración enriquecido claramente identificado y filtros reactivos por rango de fechas y plataforma.
- Pruebas automatizadas con Vitest y suites de validación completas.

---

## 2. Pila Tecnológica & Arquitectura de Directorios

### Frontend (`/client`)
- **Framework**: React 18 / 19 con TypeScript + Vite
- **Estilos**: Tailwind CSS con paleta UUPM (#F8FAFC, #FFFFFF, #0F172A, #64748B, #E2E8F0, #4F46E5, acentos Facebook #1877F2 e Instagram gradient)
- **Componentes**: Diseños tipo shadcn/ui y 21st.dev (StatCards, DataTables, Badges, Modals, Drawers, Tabs)
- **Animaciones**: `motion/react` (desplazamientos suaves, números animados, transiciones de modales y pestañas)
- **Iconografía**: `lucide-react`
- **Gráficos**: `recharts` (AreaChart de evolución temporal, BarChart comparativo FB/IG, Pie/Donut de distribución, Ranking y Heatmap semanal)
- **Manejo de Estado**: React Context API modular (`AuthContext`, `AnalyticsFilterContext`, `SyncContext`)

### Backend (`/server`)
- **Runtime**: Node.js v24 con TypeScript + Express
- **ORM / Persistencia**: Prisma ORM con soporte completo para PostgreSQL y SQLite (fallback de cero fricción local)
- **Validación**: Zod schemas para todas las solicitudes, parámetros y respuestas
- **Criptografía**: Módulo AES-256-GCM para cifrado de tokens OAuth; HMAC-SHA256 para verificación de Webhooks de Meta
- **Seguridad**: `cors`, `helmet`, `express-rate-limit`, exclusión estricta de credenciales en logs y payloads
- **Testing**: Vitest con pruebas unitarias y de integración

### Estructura de Directorios
```
c:\xampp\htdocs\EBÁNO\
├── package.json                   # Scripts raíz para orquestar client y server
├── .env.example                   # Variables de entorno documentadas
├── README.md                      # Documentación completa de instalación y uso
├── META_SETUP_GUIDE.md            # Guía paso a paso para crear la App en Meta for Developers
├── tasks/
│   ├── plan.md
│   └── todo.md
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma          # Esquema relacional
│   │   ├── seed.ts                # Semilla de datos de prueba / demo realistas
│   │   └── migrations/
│   ├── src/
│   │   ├── index.ts               # Servidor Express y arranque
│   │   ├── config/                # Variables de entorno tipadas
│   │   ├── db/prisma.ts           # Cliente Prisma singleton
│   │   ├── middleware/            # Auth, Webhook validator, Rate limiter, Error handler
│   │   ├── routes/                # oauth, accounts, posts, comments, analytics, sync, webhooks, export
│   │   ├── services/              # meta-api, sync-engine, analytics, encryption, demo-data
│   │   ├── schemas/               # Validaciones Zod
│   │   └── utils/                 # Logger seguro, formateadores
│   └── tests/                     # Suites Vitest
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css              # Tokens de diseño, tipografía y estilos globales
        ├── types/                 # Tipos TypeScript
        ├── services/api.ts        # Cliente Axios / Fetch con interceptores
        ├── context/               # Auth, Filters, Sync
        ├── components/
        │   ├── ui/                # Botones, Cards, Badges, Modales, Skeleton, Alerts
        │   ├── layout/            # Sidebar, Header, DemoBanner
        │   ├── dashboard/         # StatCards, TimelineChart, PlatformBars, TopPosts, Heatmap
        │   ├── accounts/          # ConnectModal, AccountsList, AccountStatusCard
        │   ├── posts/             # PostsTable, PostCardGrid, PostDetailDrawer
        │   ├── comments/          # CommentsTable, CommentFilters, Pagination
        │   ├── sync/              # SyncTriggerButton, SyncModal, SyncHistoryTable
        │   ├── reports/           # ExecutiveReport, CsvExportModal
        │   └── settings/          # MetaAppConfig, WebhookInfo, SecuritySettings
```

---

## 3. Modelo de Datos Relacional (Prisma)

- **User**: id, email, passwordHash, name, avatarUrl, role, createdAt, updatedAt
- **SocialAccount**: id, userId, platform (`FACEBOOK` | `INSTAGRAM`), externalId, name, username, profilePicUrl, encryptedToken, tokenExpiresAt, tokenStatus (`ACTIVE`, `EXPIRED`, `REVOKED`, `NEEDS_REAUTH`), isMonitored, lastSyncAt, createdAt, updatedAt. Clave única `@@unique([platform, externalId])`.
- **SocialPost**: id, socialAccountId, platform, externalId, permalink, message, mediaType, mediaUrl, publishedAt, apiCommentsCount, repliesCount, totalStoredComments, lastSyncAt. Clave única `@@unique([platform, externalId])`.
- **SocialComment**: id, postId, socialAccountId, platform, externalId, parentCommentId, authorName, authorExternalId, authorProfilePic, text, commentDate, isReply, replyCount, status (`VERIFIED`, `PENDING_SYNC`, `HIDDEN_BY_META`, `REMOVED`), capturedAt, updatedAt. Clave única `@@unique([platform, externalId])`.
- **SyncJob**: id, socialAccountId (opcional), triggerSource (`MANUAL`, `SCHEDULED`, `WEBHOOK`), status (`QUEUED`, `IN_PROGRESS`, `COMPLETED`, `PARTIAL`, `FAILED`), startedAt, completedAt, durationMs, postsProcessed, commentsFetched, commentsAdded, commentsUpdated, errorSummary.
- **SyncLog**: id, syncJobId, level (`INFO`, `WARN`, `ERROR`), message, metadata, timestamp.
- **AuditLog**: id, userId, action, details, ipAddress, createdAt.

---

## 4. Flujo de Integración con Meta Graph API

### Permisos Requeridos
- **Facebook**: `pages_show_list`, `pages_read_engagement`, `pages_read_user_content`, `read_insights`
- **Instagram**: `instagram_basic`, `instagram_manage_comments`, `pages_show_list`

### Flujo OAuth Seguro
1. `GET /api/oauth/meta/connect`: Genera URL de autorización en `https://www.facebook.com/v21.0/dialog/oauth` con `state` criptográfico (nonce + timestamp firmado).
2. `GET /api/oauth/meta/callback`:
   - Valida el `state` para prevenir CSRF.
   - Intercambia `code` por Short-lived User Token (`/oauth/access_token`).
   - Intercambia Short-lived por Long-lived User Token (`fb_exchange_token`, 60 días).
   - Consulta `/me/accounts` para obtener Páginas de Facebook y Page Access Tokens permanentes.
   - Para cada Página, consulta `?fields=instagram_business_account{id,username,name,profile_picture_url}`.
   - Cifra simétricamente todos los tokens con **AES-256-GCM** antes de guardarlos en la base de datos.
3. Detección proactiva de tokens vencidos o permisos revocados con estado visual `NEEDS_REAUTH`.

### Motor de Conteo y Deduplicación
- Endpoint de Posts: `/{page_id}/published_posts?fields=id,message,created_time,permalink_url,full_picture,attachments,comments.summary(true).limit(0)`.
- Endpoint de Comentarios: `/{post_id}/comments?fields=id,message,created_time,from,comments{id,message,created_time,from},like_count&limit=100`.
- Paginación cursor-based con backoff exponencial ante límites de tasa (`x-business-use-case-usage`).
- Deduplicación idempotente vía `upsert` o verificación de clave `[platform, externalId]`.
- Diferenciación clara entre comentarios de primer nivel y respuestas hijas (`parentCommentId`).
- Distinción entre "Comentarios recolectados y almacenados" vs "Comentarios reportados por la API".

---

## 5. Pruebas y Validación de Calidad
- Pruebas unitarias de cifrado / descifrado AES-256-GCM.
- Pruebas del motor de conteo, deduplicación e idempotencia.
- Pruebas de validación de firma HMAC-SHA256 en webhooks de Meta.
- Pruebas de cálculo de métricas de analítica y variaciones porcentuales (+/- %).
- Pruebas de endpoints REST con validación Zod.
- Verificación de compilación TypeScript estricta en frontend y backend.
