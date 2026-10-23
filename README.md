# SocialCount Analytics — Sistema Profesional de Conteo y Analítica de Comentarios

**SocialCount Analytics** es una plataforma SaaS moderna, de alto rendimiento y grado empresarial diseñada para centralizar, contabilizar, monitorear y analizar los comentarios de publicaciones de **Facebook Pages** e **Instagram Profesional** desde un único panel de administración unificado.

Construida con los más altos estándares de arquitectura de software, seguridad informática y diseño visual premium inspirado en **UUPM**, **21st.dev** y micro-animaciones fluidas con **Motion** (`motion/react`).

---

## 1. Características Principales

- **Conexión OAuth 2.0 Oficial con Meta**: Flujo de autorización seguro para Páginas de Facebook y cuentas de Instagram Business vinculadas.
- **Cifrado AES-256-GCM en Reposo**: Todos los Access Tokens y secretos de Meta se almacenan con cifrado simétrico y clave maestra derivada.
- **Motor de Conteo Idempotente**: Deduplicación rigurosa mediante claves compuestas únicas (`[platform, externalId]`) en base de datos.
- **Separación entre Comentarios y Respuestas**: Conteo de comentarios de primer nivel diferenciado de respuestas anidadas (`replies`).
- **Métricas Confiables en Tiempo Real**: Total de comentarios, distribución por plataforma, comentarios de hoy, publicaciones monitoreadas y variación porcentual (+/- %) frente al período anterior.
- **Visualización de Datos con Recharts**:
  - Gráfico de área de evolución temporal con gradientes multi-capa.
  - Barras comparativas de proporción entre Facebook e Instagram.
  - Ranking de publicaciones con mayor índice de interacción.
  - Distribución de actividad por día de la semana para identificar horas pico.
- **Tabla Paginada en el Servidor**: Búsqueda por texto y autor, filtros por plataforma, fecha y publicación sin sobrecargar la memoria del navegador.
- **Webhooks de Meta con Verificación Criptográfica**: Validación estricta de firma `x-hub-signature-256` mediante HMAC-SHA256 con comparación en tiempo constante (`crypto.timingSafeEqual`).
- **Exportación a CSV**: Generación de archivos CSV con cabeceras completas y UTF-8 BOM compatible con Microsoft Excel.
- **Modo Demostración Enriquecido**: Conjunto de datos de prueba realista (cuentas, posts de moda, gastronomía y diseño, comentarios y respuestas) claramente identificado mediante banners e insignias visuales.

---

## 2. Pila Tecnológica

| Capa | Tecnologías |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Motion (`motion/react`), Lucide React, Recharts |
| **Backend** | Node.js v24, TypeScript, Express, Prisma ORM, Zod, Axios, Helmet, CORS, Rate Limit |
| **Persistencia** | SQLite (desarrollo local inmediato) / PostgreSQL (producción) |
| **Criptografía** | AES-256-GCM (Tokens), HMAC-SHA256 (Webhooks), Timing-Safe Comparison |
| **Pruebas** | Vitest (Tests de cifrado, analítica, deduplicación y webhooks) |

---

## 3. Requisitos Previos

- **Node.js**: v18.0 o superior (recomendado v20+ o v24+)
- **NPM**: v9.0 o superior
- **PostgreSQL** *(opcional para producción)*: Base de datos relacional PostgreSQL 14+.

---

## 4. Instalación Rápida y Ejecución Local

### Paso 1: Clonar o situarse en el repositorio
```bash
cd c:\xampp\htdocs\EBÁNO
```

### Paso 2: Instalar dependencias
```bash
npm install
```

### Paso 3: Configurar variables de entorno
El proyecto incluye un archivo `.env.example`. Para desarrollo local ya se ha configurado un `.env` funcional en `server/.env`:
```bash
# Ver el contenido o personalizar según necesidad:
cat server/.env
```

### Paso 4: Inicializar la base de datos y datos demo
```bash
cd server
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
cd ..
```

### Paso 5: Iniciar el entorno de desarrollo
Puedes iniciar tanto el backend como el frontend concurrentemente:

**Terminal 1 (Backend en puerto 5000):**
```bash
npm run dev:server
```

**Terminal 2 (Frontend en puerto 5173):**
```bash
npm run dev:client
```

Abre en tu navegador: [http://localhost:5173](http://localhost:5173).

---

## 5. Uso con PostgreSQL (Entorno de Producción)

Para cambiar el motor de base de datos a PostgreSQL:
1. En `server/.env`, actualiza `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/socialcount_db?schema=public"
   ```
2. Ejecuta el conmutador automático de esquema:
   ```bash
   cd server
   npm run db:use-postgres
   npx prisma generate
   npx prisma db push
   ```

Para regresar a SQLite en desarrollo:
```bash
npm run db:use-sqlite
npx prisma generate
npx prisma db push
```

---

## 6. Endpoints Principales de la API

### Autenticación y OAuth
- `GET /api/oauth/meta/connect`: Genera la URL de conexión OAuth con state CSRF.
- `GET /api/oauth/meta/callback`: Callback de retorno de Meta con intercambio de tokens de larga duración.
- `GET /api/oauth/status`: Estado de las credenciales de Meta y modo actual (Demo / Producción).

### Cuentas Conectadas
- `GET /api/accounts`: Lista de cuentas de Facebook e Instagram con totales de posts y comentarios.
- `GET /api/accounts/:id`: Detalle de una cuenta específica.
- `PATCH /api/accounts/:id`: Alterna el estado de monitoreo automático (`isMonitored`).
- `DELETE /api/accounts/:id`: Desconecta y elimina las credenciales cifradas de la cuenta.
- `POST /api/accounts/reset-demo`: Restablece las cuentas de prueba.

### Analítica y Dashboard
- `GET /api/analytics/dashboard`: Métricas consolidadas, contadores, variaciones de período, evolución temporal, distribución y top posts.
  - Parámetros: `platform` (`ALL`, `FACEBOOK`, `INSTAGRAM`), `startDate`, `endDate`, `includeReplies`.

### Publicaciones y Comentarios
- `GET /api/posts`: Listado de publicaciones con paginación en servidor, filtros y ordenamiento.
- `GET /api/posts/:id`: Detalle del post y sus últimos 50 comentarios.
- `GET /api/comments`: Explorador paginado de comentarios con búsqueda por texto y autor.

### Sincronización
- `POST /api/sync/trigger`: Dispara un trabajo de sincronización manual (`accountId` opcional).
- `GET /api/sync/history`: Historial de ejecuciones con duración, posts inspeccionados y comentarios nuevos.
- `GET /api/sync/active`: Estado del trabajo de sincronización en progreso.

### Webhooks
- `GET /api/webhooks/meta`: Verificación del handshake de Meta (`hub.verify_token`, `hub.challenge`).
- `POST /api/webhooks/meta`: Recepción de eventos con validación HMAC-SHA256 (`x-hub-signature-256`).

### Exportación
- `GET /api/export/comments/csv`: Descarga directa en archivo CSV compatible con Excel.

---

## 7. Ejecución de Pruebas Automatizadas

El proyecto cuenta con suites de pruebas unitarias y de integración desarrolladas con **Vitest**:

```bash
cd server
npm test
```

Pruebas cubiertas:
- `tests/encryption.test.ts`: Cifrado y descifrado AES-256-GCM, unicidad de IVs, detección de manipulación en el tag de autenticación y enmascaramiento seguro de tokens.
- `tests/webhook-validator.test.ts`: Generación y validación de firma HMAC-SHA256 con `crypto.timingSafeEqual`.
- `tests/analytics.test.ts`: Fórmulas de variación porcentual (+/- %), distribución por plataforma y rangos de fechas.

---

## 8. Seguridad y Buenas Prácticas Aplicadas

1. **Tokens Cifrados**: Los tokens de Meta nunca se guardan en texto plano en la base de datos.
2. **Sin Fuga en Frontend**: El frontend jamás recibe ni manipula access tokens, secretos ni claves privadas.
3. **Protección CSRF**: Parámetro `state` con nonce criptográfico y caducidad temporal de 10 minutos.
4. **Rate Limiting**: Límites por IP para prevenir abusos en endpoints de sincronización y consultas generales.
5. **Cabeceras HTTP Seguras**: `helmet` configurado con políticas de recursos de origen cruzado.
6. **Manejo de Errores Limpio**: Exclusión estricta de mensajes internos de la API de Meta que pudieran contener secretos o identificadores sensibles.

---

## 9. Licencia

Proyecto desarrollado bajo licencia MIT.
