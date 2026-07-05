// app/api/portal/route.js
// Endpoint autenticado que el portal de clientes llama para obtener el estado
// de sus proyectos, leyendo DIRECTAMENTE de Odoo con la sesión del propio
// usuario portal. Odoo aplica sus reglas de acceso (ir.rules), por lo que es
// imposible que este endpoint devuelva proyectos de otro cliente.

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { odooCallKw, OdooSessionExpiredError, OdooConnectionError } from '@/lib/odoo';

// Mapping de project.task.state (Odoo 19) al estado que pinta el frontend.
const STATE_MAP = {
  '1_done': 'done',
  '01_in_progress': 'in-progress',
  '02_changes_requested': 'in-progress',
  '03_approved': 'in-progress',
  '04_waiting_normal': 'pending',
};

function mapState(state) {
  return STATE_MAP[state] || 'pending';
}

// Arma el árbol tareas/subtareas a partir de la lista plana de Odoo.
// - Top-level: parent_id === false.
// - Subtareas: se cuelgan de su ancestro top-level (anidación >1 nivel se
//   aplana). Si el padre no es visible para el usuario, se promueven a
//   top-level de su proyecto.
function buildTaskTree(rawTasks) {
  const byId = new Map(rawTasks.map((t) => [t.id, t]));

  const topLevelAncestor = (task) => {
    let current = task;
    const seen = new Set();
    while (current.parent_id && byId.has(current.parent_id[0])) {
      if (seen.has(current.id)) break; // ciclo defensivo
      seen.add(current.id);
      current = byId.get(current.parent_id[0]);
    }
    return current;
  };

  const topTasks = new Map(); // id -> {task, subtasks: []}
  for (const t of rawTasks) {
    const isTop = !t.parent_id || !byId.has(t.parent_id[0]);
    if (isTop) {
      if (!topTasks.has(t.id)) topTasks.set(t.id, { task: t, subtasks: [] });
    }
  }
  for (const t of rawTasks) {
    if (t.parent_id && byId.has(t.parent_id[0])) {
      const ancestor = topLevelAncestor(t);
      const entry = topTasks.get(ancestor.id);
      if (entry) entry.subtasks.push(t);
    }
  }

  return [...topTasks.values()].map(({ task, subtasks }) => ({
    id: task.id,
    title: task.name,
    status: mapState(task.state),
    deadline: task.date_deadline || null,
    subtasks: subtasks.map((s) => ({
      id: s.id,
      title: s.name,
      status: mapState(s.state),
    })),
  }));
}

export async function GET(request) {
  const token = await getToken({ req: request });
  if (!token || token.role !== 'client' || !token.odooSessionId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  try {
    // Dominio vacío a propósito: las ir.rules del usuario portal filtran solas.
    const projects = await odooCallKw(token.odooSessionId, 'project.project', 'search_read', [], {
      domain: [],
      fields: ['id', 'name'],
      order: 'id asc',
    });

    if (!projects || projects.length === 0) {
      return NextResponse.json({ company: token.company || token.name, projects: [] });
    }

    const projectIds = projects.map((p) => p.id);
    const rawTasks = await odooCallKw(token.odooSessionId, 'project.task', 'search_read', [], {
      domain: [
        ['project_id', 'in', projectIds],
        ['state', '!=', '1_canceled'],
      ],
      fields: ['id', 'name', 'state', 'parent_id', 'project_id', 'date_deadline'],
      order: 'sequence asc, id asc',
    });

    const result = projects.map((p) => {
      const projectTasks = (rawTasks || []).filter(
        (t) => t.project_id && t.project_id[0] === p.id
      );
      const tasks = buildTaskTree(projectTasks);
      const done = tasks.filter((t) => t.status === 'done').length;
      const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
      return { id: p.id, name: p.name, progress, tasks };
    });

    return NextResponse.json({
      company: token.company || token.name,
      projects: result,
    });
  } catch (err) {
    if (err instanceof OdooSessionExpiredError) {
      return NextResponse.json({ error: 'ODOO_SESSION_EXPIRED' }, { status: 401 });
    }
    if (err instanceof OdooConnectionError) {
      return NextResponse.json({ error: 'ODOO_UNAVAILABLE' }, { status: 502 });
    }
    console.error('Portal API error:', err);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
