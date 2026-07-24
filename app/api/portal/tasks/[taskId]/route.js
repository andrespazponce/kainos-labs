// app/api/portal/tasks/[taskId]/route.js
// Detalle de UNA tarea para el portal de clientes. Se lee con la sesión del
// propio usuario portal, así las ir.rules de Odoo garantizan que solo la
// devuelve si la tarea le fue compartida (si no, 404). Sirve para la cabecera
// de la página de tarea (nombre, estado, proyecto, subtareas).

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { odooCallKw, OdooSessionExpiredError, OdooConnectionError } from '@/lib/odoo';
import { mapState } from '@/lib/portalProjects';

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
    const tasks = await odooCallKw(token.odooSessionId, 'project.task', 'search_read', [], {
      domain: [['id', '=', taskId]],
      fields: ['id', 'name', 'state', 'stage_id', 'project_id'],
      limit: 1,
    });

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    const t = tasks[0];

    // Subtareas visibles (también son project.task, con su propio chatter).
    const rawSubtasks = await odooCallKw(token.odooSessionId, 'project.task', 'search_read', [], {
      domain: [
        ['parent_id', '=', taskId],
        ['state', '!=', '1_canceled'],
      ],
      fields: ['id', 'name', 'state'],
      order: 'sequence asc, id asc',
    });

    return NextResponse.json({
      task: {
        id: t.id,
        name: t.name,
        status: mapState(t.state),
        stageName: Array.isArray(t.stage_id) ? t.stage_id[1] : null,
        projectId: Array.isArray(t.project_id) ? t.project_id[0] : null,
        projectName: Array.isArray(t.project_id) ? t.project_id[1] : null,
        subtasks: (rawSubtasks || []).map((s) => ({
          id: s.id,
          title: s.name,
          status: mapState(s.state),
        })),
      },
    });
  } catch (err) {
    if (err instanceof OdooSessionExpiredError) {
      return NextResponse.json({ error: 'ODOO_SESSION_EXPIRED' }, { status: 401 });
    }
    if (err instanceof OdooConnectionError) {
      return NextResponse.json({ error: 'ODOO_UNAVAILABLE' }, { status: 502 });
    }
    console.error('Portal task detail API error:', err);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
