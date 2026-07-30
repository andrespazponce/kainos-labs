// app/api/portal/tasks/[taskId]/messages/route.js
// Reusa odooCallKw y odooPortalPostMessage de lib/odoo (patrón de Antonio).
// GET  — historial de mensajes de la tarea/subtarea
// POST — nuevo mensaje del usuario autenticado

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { odooCallKw, odooPortalPostMessage } from '@/lib/odoo';

export async function GET(request, { params }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'client' || !token.odooSessionId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const taskId = parseInt(params.taskId, 10);
  if (!taskId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const messages = await odooCallKw(token.odooSessionId, 'mail.message', 'search_read', [], {
      domain: [
        ['model', '=', 'project.task'],
        ['res_id', '=', taskId],
        ['message_type', 'in', ['comment', 'email']],
      ],
      fields: ['id', 'date', 'body', 'author_id', 'email_from', 'message_type'],
      order: 'date asc',
      limit: 100,
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('Messages GET error:', err.message);
    return NextResponse.json({ error: 'ODOO_ERROR', detail: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'client' || !token.odooSessionId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const taskId = parseInt(params.taskId, 10);
  if (!taskId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const { body } = await request.json();
  if (!body?.trim()) return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });

  try {
    // Reusa odooPortalPostMessage de Antonio — no reimplementa el create
    await odooPortalPostMessage(token.odooSessionId, 'project.task', taskId, body.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Messages POST error:', err.message);
    return NextResponse.json({ error: 'ODOO_ERROR', detail: err.message }, { status: 500 });
  }
}
