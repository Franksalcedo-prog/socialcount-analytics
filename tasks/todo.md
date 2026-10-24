# Tareas de Implementación: SocialCount Analytics

- [x] 1. Configuración del proyecto y entorno de desarrollo <!-- id: 1 -->
  - [x] 1.1 Inicializar package.json raíz con scripts de orquestación concurrentes <!-- id: 1.1 -->
  - [x] 1.2 Configurar el servidor Node.js + Express + TypeScript con Zod y cors <!-- id: 1.2 -->
  - [x] 1.3 Configurar el cliente React + Vite + Tailwind CSS + Lucide + Recharts + Motion <!-- id: 1.3 -->
  - [x] 1.4 Crear .env.example con todas las variables documentadas <!-- id: 1.4 -->

- [x] 2. Base de datos y ORM (Prisma) <!-- id: 2 -->
  - [x] 2.1 Definir esquema Prisma (User, SocialAccount, SocialPost, SocialComment, SyncJob, SyncLog, AuditLog) con índices y claves únicas compuestas <!-- id: 2.1 -->
  - [x] 2.2 Configurar cliente Prisma singleton con soporte PostgreSQL / SQLite con cero fricción <!-- id: 2.2 -->
  - [x] 2.3 Crear script de migración y seed con datos de demostración realistas para Facebook e Instagram <!-- id: 2.3 -->

- [x] 3. Servicios de Backend y Lógica de Negocio <!-- id: 3 -->
  - [x] 3.1 Módulo de criptografía AES-256-GCM para cifrado y descifrado seguro de tokens <!-- id: 3.1 -->
  - [x] 3.2 Servicio de integración con Meta Graph API v21.0 (OAuth, token exchange, fetch posts & comments con paginación cursor-based) <!-- id: 3.2 -->
  - [x] 3.3 Motor de sincronización idempotente con deduplicación por [platform, externalId], separación de respuestas y registro de logs <!-- id: 3.3 -->
  - [x] 3.4 Servicio de analítica (cálculo de totales, evolución temporal, comparativa de plataformas, ranking de posts, actividad semanal y variación porcentual) <!-- id: 3.4 -->
  - [x] 3.5 Endpoint y validador de Webhooks de Meta con verificación HMAC-SHA256 (x-hub-signature-256) <!-- id: 3.5 -->
  - [x] 3.6 Servicio de exportación a CSV con filtrado dinámico <!-- id: 3.6 -->

- [x] 4. Controladores y Rutas API (Express) <!-- id: 4 -->
  - [x] 4.1 Rutas de autenticación y sesión <!-- id: 4.1 -->
  - [x] 4.2 Rutas de OAuth y gestión de cuentas conectadas (conectar, desconectar, verificar estado de tokens) <!-- id: 4.2 -->
  - [x] 4.3 Rutas de analítica y métricas de dashboard <!-- id: 4.3 -->
  - [x] 4.4 Rutas de publicaciones y comentarios (paginación real, búsqueda, filtros) <!-- id: 4.4 -->
  - [x] 4.5 Rutas de sincronización (disparar sync, estado de progreso, historial de logs) <!-- id: 4.5 -->
  - [x] 4.6 Rutas de exportación de informes <!-- id: 4.6 -->

- [x] 5. Frontend UI/UX con Estética SaaS Premium <!-- id: 5 -->
  - [x] 5.1 Configuración de Tailwind CSS con paleta UUPM, variables de color y tipografía Inter <!-- id: 5.1 -->
  - [x] 5.2 Componentes base tipo shadcn/21st.dev (Buttons, Cards, Badges, Modals, Tabs, Selects, Drawers, Skeletons) <!-- id: 5.2 -->
  - [x] 5.3 Layout maestro (Sidebar adaptable, Topbar con selector de fechas, filtro de plataforma, botón de sincronización activa y selector de usuario) <!-- id: 5.3 -->
  - [x] 5.4 Vista de Resumen General (Dashboard con tarjetas métricas animadas, gráficos Recharts interactivos, ranking y comparativa) <!-- id: 5.4 -->
  - [x] 5.5 Vista de Analítica Profunda (tendencias por día/semana/mes, distribución de actividad, comparador de períodos) <!-- id: 5.5 -->
  - [x] 5.6 Vista de Cuentas Conectadas (Facebook Pages e Instagram Business, estado de tokens, modal de conexión OAuth, reconexión) <!-- id: 5.6 -->
  - [x] 5.7 Vista de Publicaciones (Grid y tabla, miniaturas, métricas de comentarios, drawer lateral de detalle con lista de comentarios) <!-- id: 5.7 -->
  - [x] 5.8 Vista de Comentarios (Tabla profesional paginada en servidor, búsqueda por texto, filtros de plataforma/cuenta/fecha, estados) <!-- id: 5.8 -->
  - [x] 5.9 Vista de Historial de Sincronización (Jobs, duración, posts procesados, comentarios nuevos/actualizados, errores) <!-- id: 5.9 -->
  - [x] 5.10 Vista de Informes y Exportación CSV <!-- id: 5.10 -->
  - [x] 5.11 Vista de Configuración (Meta App ID, App Secret, Webhooks, frecuencia de cron, modo de demostración) <!-- id: 5.11 -->
  - [x] 5.12 Manejo integral de estados (sin cuentas, cargando, sincronizando, permisos insuficientes, token expirado, modo demo) <!-- id: 5.12 -->
  - [x] 5.13 Detección y visualización de la persona más comentada / activa y más mencionada por publicación en Grid, Tabla, Drawer y Dashboard <!-- id: 5.13 -->

- [x] 6. Pruebas Automatizadas y Validación <!-- id: 6 -->
  - [x] 6.1 Pruebas unitarias de cifrado AES-256-GCM <!-- id: 6.1 -->
  - [x] 6.2 Pruebas de deduplicación e idempotencia en sincronización <!-- id: 6.2 -->
  - [x] 6.3 Pruebas de cálculo de métricas de analítica y variaciones porcentuales <!-- id: 6.3 -->
  - [x] 6.4 Pruebas de verificación de firma HMAC en webhooks <!-- id: 6.4 -->
  - [x] 6.5 Validación de compilación completa en frontend y backend <!-- id: 6.5 -->

- [x] 7. Documentación y Entrega <!-- id: 7 -->
  - [x] 7.1 README.md detallado con arquitectura, instalación y ejecución <!-- id: 7.1 -->
  - [x] 7.2 META_SETUP_GUIDE.md con paso a paso para configurar la App en Meta for Developers, permisos y webhooks <!-- id: 7.2 -->
  - [x] 7.3 Verificación final de funcionamiento en navegador <!-- id: 7.3 -->
