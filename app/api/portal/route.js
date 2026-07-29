// app/api/portal/route.js
// Usa getToken() para leer odooSessionId directamente del JWT,
// ya que Antonio intencionalmente NO lo copia a la session
// (para no exponerlo al navegador vía /api/auth/session).

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB  = process.env.ODOO_DB;

async function odooCall(sessionId, model, method, args, kwargs = {}) {
  const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session_id=${sessionId}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0', method: 'call', id: 1,
      params: { model, method, args, kwargs },
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.data?.message || json.error.message);
  return json.result;
}

function parseStatus(stageId) {
  if (!stageId) return 'pending';
  const s = (Array.isArray(stageId) ? stageId[1] : stageId).toString().toLowerCase();
  if (s.includes('done') || s.includes('complet') || s.includes('cerrad')) return 'done';
  if (s.includes('progress') || s.includes('proceso') || s.includes('curso')) return 'in-progress';
  return 'pending';
}

export async function GET(request) {
  // Leemos el JWT directamente — aquí sí está odooSessionId
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== 'client' || !token.odooSessionId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const sid = token.odooSessionId;

  try {
    // Proyectos del usuario autenticado
    const projects = await odooCall(sid, 'project.project', 'search_read',
      [[['privacy_visibility', '!=', 'followers']]],
      { fields: ['id', 'name'], limit: 20 }
    );

    const result = await Promise.all(projects.map(async (proj) => {
      // Tareas principales con milestone_id incluido
      const rawTasks = await odooCall(sid, 'project.task', 'search_read',
        [[['project_id', '=', proj.id], ['parent_id', '=', false]]],
        {
          fields: ['id', 'name', 'stage_id', 'date_deadline', 'milestone_id', 'child_ids'],
          order: 'milestone_id asc, date_deadline asc',
        }
      );

      // Subtareas
      const allChildIds = rawTasks.flatMap(t => t.child_ids || []);
      const subtaskMap = {};
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

      // Progreso global
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
        return {
          ...m,
          progress: m.tasks.length > 0 ? Math.round((mDone / m.tasks.length) * 100) : 0,
        };
      });

      return { id: proj.id, name: proj.name, progress, tasks, milestones };
    }));

    return NextResponse.json({
      company: token.company || token.name || '',
      projects: result,
    });

  } catch (err) {
    console.error('Portal API error:', err.message);
    const msg = err.message?.toLowerCase() || '';
    if (msg.includes('session') || msg.includes('expired')) {
      return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
    }
    return NextResponse.json({ error: 'ODOO_ERROR', detail: err.message }, { status: 500 });
  }
}
