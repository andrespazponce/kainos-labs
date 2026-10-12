# kainos-labs — Sitio SagaSoft + portal de clientes (datos de Odoo)

Sitio institucional de SagaSoft ("Tecnología que transforma empresas": chatbots IA, automatización) más un **portal de clientes** donde cada cliente ve el avance de su proyecto (objetivos/milestones, tareas, subtareas, mensajes) leído desde Odoo, y un **panel admin**. Repo `github.com/andrespazponce/kainos-labs` (de Andrés; flujo por PRs — **no pushear/mergear sin confirmar**). El README está vacío.

## Stack
Next.js 14.2 (App Router, **JavaScript**), React 18, NextAuth v4 (sesión JWT), Supabase (`@supabase/supabase-js`), DOMPurify. Probable deploy en Vercel (`ADMIN_EMAILS` se define ahí). No tiene Docker ni compose: `npm run dev` (puerto 3000; ver `.claude/launch.json`).

## Estructura
- `app/page.js` sitio público; contenido en `lib/site-config.js` (editar ahí los textos).
- `app/portal/` (login, lista, `[id]` proyecto, `[id]/tasks/[taskId]`) y `app/api/portal/**`.
- `app/admin/` y `app/api/admin/clients/**` (CRUD de clientes en Supabase).
- `lib/odoo.js` cliente JSON-RPC server-only (errores tipados `OdooConnectionError`, `OdooSessionExpiredError`, `OdooRpcError`); `lib/portalProjects.js` mapea estados de `project.task` de Odoo 19 al front; `lib/auth.js`, `lib/admin-guard.js`, `lib/supabase-server.js`.

## Cómo funciona la auth (no romper)
- **Admin**: Google OAuth, restringido a los correos de `ADMIN_EMAILS` (lista separada por comas).
- **Cliente del portal**: provider `odoo-credentials` valida email+contraseña contra Odoo y guarda SOLO la `session_id` de Odoo dentro del JWT de NextAuth (la contraseña nunca se persiste). Las llamadas a Odoo usan esa sesión, así aplican las `ir.rule` y cada cliente ve solo lo que tiene compartido. Leer la sesión con `getToken()` (hubo un fix por usar otra vía).
- Tabla Supabase `clients` (`access_code` tipo `KL-XXXX-XXXX`, `odoo_project_id`, `status`) y `tasks`. `SUPABASE_SERVICE_ROLE_KEY` es solo servidor.

## Variables de entorno (nombres; valores en `.env.local`, nunca commitear)
`NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ADMIN_EMAILS, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ODOO_URL, ODOO_DB`.

## Reglas
- `lib/odoo.js` y `supabase-server.js` jamás se importan desde componentes cliente.
- Para probar contra Odoo local: `D:\dev\odoo-desarrollo` (puerto 8078) y `ODOO_URL` accesible desde donde corra Next (no hay contenedor aquí, así que `http://localhost:8078` sirve).
- El README solo contiene un comentario `redeploy trigger <timestamp>` (parece usarse para forzar un redeploy con un commit): no lo borres sin avisar.
