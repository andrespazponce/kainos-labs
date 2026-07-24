// app/api/portal/tasks/[taskId]/messages/route.js
// Chatter de project.task para el portal de clientes — igual que el portal
// web nativo de Odoo. En Odoo 19 project.task tiene _mail_post_access = 'read',
// así que un usuario portal con acceso de lectura a su tarea puede LEER y
// POSTEAR en el chatter con SU PROPIA sesión (Odoo atribuye el autor a su
// partner automáticamente y sus ir.rules garantizan el aislamiento). No hace
// falta ningún bot ni usuario de servicio.
//
// GET  → lista los comentarios de la tarea (Odoo excluye solas las notas
//        internas para usuarios portal).
// POST → publica un comentario como el propio cliente.

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  odooCallKw,
  odooPortalPostMessage,
  OdooSessionExpiredError,
  OdooConnectionError,
} from '@/lib/odoo';

const MAX_BODY_LEN = 5000;

function mapError(err, context) {
  if (err instanceof OdooSessionExpiredError) {
    return NextResponse.json({ error: 'ODOO_SESSION_EXPIRED' }, { status: 401 });
  }
  if (err instanceof OdooConnectionError) {
    return NextResponse.json({ error: 'ODOO_UNAVAILABLE' }, { status: 502 });
  }
  console.error(`Portal task chatter ${context} error:`, err);
  return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
}

// Verifica, con la sesión del propio cliente, que la tarea le sea visible.
// Devuelve true/false. Da errores HTTP limpios (404/403) en vez de dejar que
// message_post lance un AccessError genérico.
async function clientCanSeeTask(sessionId, taskId) {
  const rows = await odooCallKw(sessionId, 'project.task', 'search_read', [], {
    domain: [['id', '=', taskId]],
    fields: ['id'],
    limit: 1,
  });
  return Array.isArray(rows) && rows.length > 0;
}

// Escapa texto plano a HTML seguro. NUNCA pasamos HTML crudo del usuario a
// Odoo: escapamos y convertimos saltos de línea en <br>.
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textToHtml(text) {
  return escapeHtml(text.trim()).replace(/\r\n|\r|\n/g, '<br>');
}

// Strip conservador del HTML que devuelve Odoo, como defense-in-depth en el
// servidor. La sanitización AUTORITATIVA es DOMPurify en el cliente, justo
// antes de renderizar con dangerouslySetInnerHTML.
function stripDangerousHtml(html) {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<\s*(script|style|iframe|object|embed|form|svg|math|link|meta|base)[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|form|svg|math|link|meta|base)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*"\s*(javascript:|data:)[^"]*"/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*'\s*(javascript:|data:)[^']*'/gi, "$1='#'");
}

export async function GET(request, { params }) {
  const token = await getToken({ req: request });
  if (!token || token.role !== 'client' || !token.odooSessionId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const taskId = Number(params.taskId);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  try {
    const visible = await clientCanSeeTask(token.odooSessionId, taskId);
    if (!visible) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const rawMessages = await odooCallKw(token.odooSessionId, 'mail.message', 'search_read', [], {
      domain: [
        ['model', '=', 'project.task'],
        ['res_id', '=', taskId],
        ['message_type', 'in', ['comment', 'email']],
      ],
      fields: ['id', 'date', 'body', 'author_id', 'email_from', 'message_type'],
      order: 'date desc',
      limit: 100,
    });

    const myPartnerId = token.odooPartnerId || null;
    const messages = (rawMessages || [])
      .map((m) => {
        const authorId = Array.isArray(m.author_id) ? m.author_id[0] : null;
        const authorName = (Array.isArray(m.author_id) ? m.author_id[1] : null) || m.email_from || 'Sistema';
        return {
          id: m.id,
          date: m.date,
          authorId,
          authorName,
          isMine: myPartnerId != null && authorId === myPartnerId,
          body: stripDangerousHtml(m.body || ''),
        };
      })
      .reverse(); // Odoo entrega date desc; mostramos del más viejo al más nuevo.

    return NextResponse.json({ messages });
  } catch (err) {
    return mapError(err, 'GET');
  }
}

export async function POST(request, { params }) {
  const token = await getToken({ req: request });
  if (!token || token.role !== 'client' || !token.odooSessionId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const taskId = Number(params.taskId);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'EMPTY_BODY' }, { status: 400 });
  }

  const rawBody = typeof payload?.body === 'string' ? payload.body : '';
  if (!rawBody.trim()) {
    return NextResponse.json({ error: 'EMPTY_BODY' }, { status: 400 });
  }
  if (rawBody.length > MAX_BODY_LEN) {
    return NextResponse.json({ error: 'BODY_TOO_LONG' }, { status: 400 });
  }

  try {
    // Gate de acceso con la sesión del propio cliente (404 si no la ve).
    const visible = await clientCanSeeTask(token.odooSessionId, taskId);
    if (!visible) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    // Postea vía el endpoint del portal nativo de Odoo (/mail/message/post),
    // con la sesión del propio cliente. Odoo valida su acceso y hace el
    // message_post con sudo (ver odooPortalPostMessage). El autor queda como
    // el partner del cliente.
    await odooPortalPostMessage(token.odooSessionId, 'project.task', taskId, textToHtml(rawBody));

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return mapError(err, 'POST');
  }
}
