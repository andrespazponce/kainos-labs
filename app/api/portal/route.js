// app/api/portal/route.js
// Igual que el de Antonio pero agrega milestone_id al query de tareas.
// Agrupa las tareas por milestone antes de devolverlas al cliente.

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB  = process.env.ODOO_DB;

async function odooCall(session_id, model, method, args, kwargs = {}) {
  const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `session_id=${session_id}` },
    body: JSON.stringify({
      jsonrpc: '2.0', method: 'call', id: 1,
      params: { model, method, args, kwargs },
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.data?.message || json.error.message);
  return json.result;
}

function parseStatus(odooStage) {
  if (!odooStage) return 'pending';
  const s = (typeof odooStage === 'string' ? odooStage : odooStage[1] || '').toLowerCase();
  if (s.includes('done') || s.includes('complet') || s.includes('cerrad')) return 'done';
  if (s.includes('progress') || s.includes('proceso') || s.includes('curso')) return 'in-progress';
  return 'pending';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.odooSessionId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  try {
    const sid = session.odooSessionId;

    // Proyectos del usuario autenticado
    const projects = await odooCall(sid, 'project.project', 'search_read',
      [[['privacy_visibility', '!=', 'followers']]],
      { fields: ['id', 'name'], limit: 20 }
    );

    const result = await Promise.all(projects.map(async (proj) => {
      // Tareas — agregamos milestone_id a los fields
      const rawTasks = await odooCall(sid, 'project.task', 'search_read',
        [[['project_id', '=', proj.id], ['parent_id', '=', false]]],
        {
          fields: ['id', 'name', 'stage_id', 'date_deadline', 'milestone_id', 'child_ids'],
          order: 'milestone_id asc, date_deadline asc',
        }
      );

      // Subtareas
      const allChildIds = rawTasks.flatMap(t => t.child_ids || []);
      let subtaskMap = {};
      if (allChildIds.length > 0) {
        const rawSubs = await odooCall(sid, 'project.task', 'search_read',
          [[['id', 'in', allChildIds]]],
          { fields: ['id', 'name', 'stage_id', 'parent_id'] }
        );
        rawSubs.forEach(s => {
          const pid = Array.isArray(s.parent_id) ? s.parent_id[0] : s.parent_id;
          if (!subtaskMap[pid]) subtaskMap[pid] = [];
          subtaskMap[pid].push({
            id: s.id,
            title: s.name,
            status: parseStatus(s.stage_id),
          });
        });
      }

      // Construir tareas con milestone
      const tasks = rawTasks.map(t => ({
        id: t.id,
        title: t.name,
        status: parseStatus(t.stage_id),
        deadline: t.date_deadline || null,
        milestone_id:   Array.isArray(t.milestone_id) ? t.milestone_id[0] : null,
        milestone_name: Array.isArray(t.milestone_id) ? t.milestone_id[1] : null,
        subtasks: subtaskMap[t.id] || [],
      }));

      // Progreso: tareas done / total
      const done = tasks.filter(t => t.status === 'done').length;
      const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

      // Agrupar por milestone
      const milestoneMap = {};
      tasks.forEach(task => {
        const key   = task.milestone_id   ?? 'sin-milestone';
        const label = task.milestone_name ?? 'Sin objetivo asignado';
        if (!milestoneMap[key]) {
          milestoneMap[key] = { id: key, name: label, tasks: [] };
        }
        milestoneMap[key].tasks.push(task);
      });

      const milestones = Object.values(milestoneMap).map(m => {
        const mDone  = m.tasks.filter(t => t.status === 'done').length;
        const mTotal = m.tasks.length;
        return {
          ...m,
          progress: mTotal > 0 ? Math.round((mDone / mTotal) * 100) : 0,
        };
      });

      return { id: proj.id, name: proj.name, progress, tasks, milestones };
    }));

    // Nombre del usuario desde la sesión
    const company = session.user?.name || session.user?.email || '';

    return NextResponse.json({ company, projects: result });
  } catch (err) {
    console.error('Portal API error:', err.message);
    if (err.message?.includes('Session expired') || err.message?.includes('session')) {
      return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
    }
    return NextResponse.json({ error: 'ODOO_ERROR', detail: err.message }, { status: 500 });
  }
}
