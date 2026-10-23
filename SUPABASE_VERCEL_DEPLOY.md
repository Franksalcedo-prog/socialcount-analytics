# Guía de Despliegue en Supabase y Vercel

Esta guía contiene las instrucciones exactas y los pasos necesarios para desplegar **SocialCount Analytics** utilizando tu base de datos PostgreSQL en **Supabase** (Proyecto `wsszgtzsznrobjlwcnny`) y la plataforma **Vercel** (`frank-cf84`).

---

## 1. Configuración de la Base de Datos en Supabase

Tu proyecto en Supabase: [https://supabase.com/dashboard/project/wsszgtzsznrobjlwcnny](https://supabase.com/dashboard/project/wsszgtzsznrobjlwcnny)

### Opción A: Crear las tablas mediante SQL Editor (Más Rápido — 1 Clic)
1. Ingresa a tu panel de Supabase: [https://supabase.com/dashboard/project/wsszgtzsznrobjlwcnny/sql](https://supabase.com/dashboard/project/wsszgtzsznrobjlwcnny/sql)
2. Haz clic en **New query** (Nueva consulta).
3. Abre y copia todo el contenido del archivo generado en este proyecto:
   👉 [`supabase_schema.sql`](./supabase_schema.sql)
4. Pégalo en el editor de Supabase y haz clic en el botón verde **Run** (Ejecutar).
5. ¡Listo! En la pestaña **Table Editor** verás creadas todas las tablas:
   - `users`
   - `social_accounts`
   - `social_posts`
   - `social_comments`
   - `sync_jobs`
   - `sync_logs`
   - `audit_logs`

### Opción B: Obtener la Connection String para Vercel
1. En Supabase, dirígete a **Project Settings** (icono de engranaje en la barra lateral) > **Database**.
2. Desplázate hacia abajo hasta la sección **Connection string**.
3. Selecciona la pestaña **URI** o **Connection Pooling** (recomendado para Serverless):
   - Formato habitual:
     ```
     postgresql://postgres.wsszgtzsznrobjlwcnny:[TU-CONTRASEÑA]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   *(Reemplaza `[TU-CONTRASEÑA]` por la contraseña que creaste al dar de alta el proyecto en Supabase).*

---

## 2. Despliegue en Vercel

Tu cuenta de Vercel: [https://vercel.com/frank-cf84](https://vercel.com/frank-cf84)  
Proyecto ya inicializado: **`socialcount-analytics`**

### Configurar Variables de Entorno en Vercel
1. Ve a la configuración de tu proyecto en Vercel:  
   [https://vercel.com/frank-cf84/socialcount-analytics/settings/environment-variables](https://vercel.com/frank-cf84/socialcount-analytics/settings/environment-variables)
2. Añade las siguientes variables de entorno:

| Variable | Valor Recomendado |
|---|---|
| `DATABASE_URL` | La URL de conexión de Supabase obtenida en el Paso 1 (con el pooler `6543` y `pgbouncer=true`). |
| `ENCRYPTION_MASTER_KEY` | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` (o tu propia clave de 32 bytes en hex). |
| `JWT_SECRET` | Una clave secreta para los tokens de sesión. |
| `META_APP_ID` | Tu App ID de Meta for Developers. |
| `META_APP_SECRET` | Tu App Secret de Meta for Developers. |
| `META_API_VERSION` | `v21.0` |
| `META_REDIRECT_URI` | `https://socialcount-analytics.vercel.app/api/oauth/meta/callback` |
| `META_WEBHOOK_VERIFY_TOKEN` | Tu token de verificación de webhooks. |
| `DEMO_MODE_DEFAULT` | `false` (o `true` para conservar datos de prueba mientras configuras Meta). |

---

## 3. Despliegue a Producción

### Método 1: Despliegue con Vercel CLI (Desde la consola local)
Ejecuta en la raíz del proyecto:
```bash
vercel --prod
```
Vercel compilará el frontend con Vite, configurará las rutas serverless de la API y desplegará la aplicación en segundos proporcionándote tu URL de producción definitiva (ej. `https://socialcount-analytics.vercel.app`).

### Método 2: Despliegue Automático mediante GitHub
1. En [https://vercel.com/new](https://vercel.com/new), selecciona tu repositorio:  
   `https://github.com/Franksalcedo-prog/socialcount-analytics`
2. Vercel detectará automáticamente la configuración de `vercel.json` y el framework Vite.
3. Ingresa las variables de entorno descritas arriba y haz clic en **Deploy**.
4. A partir de ese momento, cada commit que hagamos y subamos a la rama `main` se desplegará de forma 100% automática en Vercel.
