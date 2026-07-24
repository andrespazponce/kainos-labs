// lib/portalProjects.js
// Helpers compartidos para mapear datos de proyectos/tareas de Odoo al shape
// que consume el portal. Usados por /api/portal (lista) y /api/portal/[id]
// (detalle). Extraídos de app/api/portal/route.js para no duplicar lógica.

// Mapping de project.task.state (Odoo 19) al estado que pinta el frontend.
export const STATE_MAP = {
  '1_done': 'done',
  '01_in_progress': 'in-progress',
  '02_changes_requested': 'in-progress',
  '03_approved': 'in-progress',
  '04_waiting_normal': 'pending',
};

export function mapState(state) {
  return STATE_MAP[state] || 'pending';
}

// Arma el árbol tareas/subtareas a partir de la lista plana de Odoo.
// - Top-level: parent_id === false.
// - Subtareas: se cuelgan de su ancestro top-level (anidación >1 nivel se
//   aplana). Si el padre no es visible para el usuario, se promueven a
//   top-level de su proyecto.
export function buildTaskTree(rawTasks) {
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

// Porcentaje de avance = tareas top-level completadas / total top-level.
export function computeProgress(tasks) {
  const done = tasks.filter((t) => t.status === 'done').length;
  return tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
}
