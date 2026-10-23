# Guía Oficial de Configuración en Meta for Developers

Esta guía detalla los pasos exactos para registrar tu aplicación en **Meta for Developers**, obtener tus credenciales (`App ID` y `App Secret`), autorizar tus Páginas de Facebook y vincular perfiles de Instagram Profesional con **SocialCount Analytics**.

---

## 1. Crear la Aplicación en Meta for Developers

1. Accede a [https://developers.facebook.com/](https://developers.facebook.com/) e inicia sesión con tu cuenta de Facebook administrada.
2. Haz clic en **Mis apps** en la esquina superior derecha y luego en **Crear app**.
3. Selecciona el tipo de caso de uso: **Empresa (Business)**.
4. Asigna un nombre a la app (ejemplo: `SocialCount Analytics Hub`).
5. Asocia tu cuenta de **Meta Business Manager** (administrador comercial) y añade tu correo de contacto técnico.
6. Haz clic en **Crear app**.

---

## 2. Agregar Productos a la App

En el panel principal de la aplicación:

### A) Facebook Login for Business (Inicio de sesión para empresas)
1. En la sección **Añadir productos a tu app**, busca **Facebook Login for Business** y haz clic en **Configurar**.
2. Dirígete a **Configuración** de Facebook Login en la barra lateral izquierda.
3. En el campo **URI de redirección de OAuth válidos**, ingresa:
   - Para desarrollo local: `http://localhost:5000/api/oauth/meta/callback`
   - Para tu dominio de producción: `https://tu-dominio.com/api/oauth/meta/callback`
4. Guarda los cambios.

### B) Webhooks (Opcional para sincronización en tiempo real)
1. En la barra lateral, añade el producto **Webhooks**.
2. En el menú desplegable, selecciona el objeto **Page** y haz clic en **Suscribirse a este objeto**.
3. Ingresa:
   - **URL de devolución de llamada**: `https://tu-dominio.com/api/webhooks/meta`
   - **Token de verificación**: El mismo valor configurado en `META_WEBHOOK_VERIFY_TOKEN` en tu archivo `.env`.
4. Haz clic en **Verificar y guardar**.
5. Suscríbete a los campos: `feed`, `conversations`.
6. En el menú desplegable de objetos, selecciona **Instagram** y suscríbete a los campos `comments`, `mentions`.

---

## 3. Permisos Requeridos y Casos de Uso

Para que la aplicación pueda leer las publicaciones y comentarios autorizados, asegúrate de solicitar los siguientes permisos en **Revisión de la app > Permisos y funciones**:

| Permiso | Propósito |
|---|---|
| `pages_show_list` | Permite descubrir la lista de Páginas de Facebook que administra el usuario. |
| `pages_read_engagement` | Permite consultar estadísticas de engagement y metadatos de las publicaciones. |
| `pages_read_user_content` | Permite acceder a los comentarios y contenido publicado por usuarios en la Página. |
| `instagram_basic` | Permite leer la información básica de la cuenta de Instagram vinculada a la Página. |
| `instagram_manage_comments` | Permite leer, contabilizar y sincronizar los comentarios de publicaciones en Instagram. |
| `read_insights` *(opcional)* | Permite enriquecer las métricas con analítica agregada de impresiones y alcance. |

> **Nota importante sobre el Acceso Estándar vs Acceso Avanzado:**  
> - En **Modo Desarrollo (Development Mode)**, cualquier usuario agregado como *Administrador, Desarrollador o Tester* en el panel de Meta podrá conectar sus páginas inmediatamente sin necesidad de revisión de la app.  
> - Para conectar cuentas de usuarios externos o empresas terceras en **Modo En Vivo (Live Mode)**, se debe completar el proceso de **App Review (Revisión de la aplicación)** y verificación comercial en Meta.

---

## 4. Requisitos de Instagram Profesional

Para que Instagram Graph API permita consultar medios y comentarios:
1. La cuenta de Instagram debe ser de tipo **Profesional** (Empresa o Creador), no un perfil personal.
2. La cuenta de Instagram debe estar vinculada directamente a una **Página de Facebook** administrada por el usuario:
   - En la app de Instagram: *Configuración > Cuenta > Cuentas vinculadas > Facebook*.
   - O en Facebook: *Configuración de la Página > Cuentas vinculadas > Instagram*.

---

## 5. Configurar las Variables de Entorno en SocialCount

Copia tu **Identificador de la app (App ID)** y tu **Clave secreta de la app (App Secret)** desde *Configuración de la app > Básica* en Meta:

En el archivo `server/.env`:
```env
META_APP_ID="123456789012345"
META_APP_SECRET="abcdef0123456789abcdef0123456789"
META_API_VERSION="v21.0"
META_REDIRECT_URI="http://localhost:5000/api/oauth/meta/callback"
META_WEBHOOK_VERIFY_TOKEN="socialcount_webhook_secret_verify_token_2026"
DEMO_MODE_DEFAULT=false
```

Reinicia el servidor:
```bash
npm run dev:server
```

¡Listo! Al hacer clic en **Conectar Cuenta** en el panel de SocialCount Analytics, se abrirá el cuadro de diálogo oficial de Meta para conceder acceso a tus Páginas e Instagram.
