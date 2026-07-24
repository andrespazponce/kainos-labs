// app/api/portal/[id]/route.js
// Detalle de UN proyecto para el portal de clientes. Igual que /api/portal
// pero scoped a un solo proyecto: lo lee con la sesión del propio usuario
// portal, así las ir.rules de Odoo garantizan que solo devuelve el proyecto
// si le fue compartido (si no, 404). Este lookup es además el gate de acceso
// que reutiliza el POST de mensajes.

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { odooCallKw, OdooSessionExpiredError, OdooConnectionError } from '@/lib/odoo';
import { buildTaskTree, computeProgress } from '@/lib/portalProjects';

export async function GET(request, { params }) {
  const token = await getToken({ req: request });
  if (!token || token.role !== 'client' || !token.odooSessionId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const projectId = Number(params.id);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  try {
    // Domain acotado al id: las ir.rules del usuario portal devuelven vacío
    // si el proyecto no le fue compartido → 404 (no filtramos nosotros).
    const projects = await odooCallKw(token.odooSessionId, 'project.project', 'search_read', [], {
      domain: [['id', '=', projectId]],
      fields: ['id', 'name'],
      limit: 1,
    });

    if (!projects || projects.length === 0) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    const p = projects[0];

    const rawTasks = await odooCallKw(token.odooSessionId, 'project.task', 'search_read', [], {
      domain: [
        ['project_id', '=', projectId],
        ['state', '!=', '1_canceled'],
      ],
      fields: ['id', 'name', 'state', 'parent_id', 'project_id', 'date_deadline'],
      order: 'sequence asc, id asc',
    });

    const tasks = buildTaskTree(rawTasks || []);
    const progress = computeProgress(tasks);

    return NextResponse.json({
      company: token.company || token.name,
      project: { id: p.id, name: p.name, progress, tasks },
    });
  } catch (err) {
    if (err instanceof OdooSessionExpiredError) {
      return NextResponse.json({ error: 'ODOO_SESSION_EXPIRED' }, { status: 401 });
    }
    if (err instanceof OdooConnectionError) {
      return NextResponse.json({ error: 'ODOO_UNAVAILABLE' }, { status: 502 });
    }
    console.error('Portal project detail API error:', err);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
