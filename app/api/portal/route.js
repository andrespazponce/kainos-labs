// app/api/portal/route.js
// Agrega user_ids (encargados) al query de tareas.
// Devuelve milestone_id, encargados, y subtareas con sus encargados.

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

const ODOO_URL = process.env.ODOO_URL;

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

// Calcula progreso de un conjunto de tareas.
// done = 100% de su peso, in-progress = peso parcial (para visual),
// pending = 0%.
function calcProgress(tasks, totalTasks) {
  if (totalTasks === 0) return { pct: 0, inProgressPct: 0 };
  const weight = 100 / totalTasks;
  const donePct = tasks.filter(t => t.status === 'done').length * weight;
  const inProgressPct = tasks.filter(t => t.status === 'in-progress').length * weight;
  return {
    pct: Math.round(donePct),
    inProgressPct: Math.round(inProgressPct), // visual only, no suma al total
  };
}

export async function GET(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== 'client' || !token.odooSessionId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const sid = token.odooSessionId;

  try {
    const projects = await odooCall(sid, 'project.project', 'search_read',
      [[['privacy_visibility', '!=', 'followers']]],
      { fields: ['id', 'name'], limit: 20 }
    );

    const result = await Promise.all(projects.map(async (proj) => {

      // Tareas principales — incluimos user_ids para los encargados
      const rawTasks = await odooCall(sid, 'project.task', 'search_read',
        [[['project_id', '=', proj.id], ['parent_id', '=', false]]],
        {
          fields: ['id', 'name', 'stage_id', 'date_deadline', 'milestone_id', 'child_ids', 'user_ids'],
          order: 'milestone_id asc, date_deadline asc',
        }
      );

      // Subtareas con encargados
      const allChildIds = rawTasks.flatMap(t => t.child_ids || []);
      const subtaskMap = {};
      if (allChildIds.length > 0) {
        const rawSubs = await odooCall(sid, 'project.task', 'search_read',
          [[['id', 'in', allChildIds]]],
          { fields: ['id', 'name', 'stage_id', 'parent_id', 'user_ids'] }
        );

        // Obtener nombres de usuarios de subtareas
        const subUserIds = [...new Set(rawSubs.flatMap(s => s.user_ids || []))];
        let subUserMap = {};
        if (subUserIds.length > 0) {
          const subUsers = await odooCall(sid, 'res.users', 'read',
            [subUserIds, ['id', 'name']]
          );
          subUsers.forEach(u => { subUserMap[u.id] = u.name; });
        }

        rawSubs.forEach(s => {
          const pid = Array.isArray(s.parent_id) ? s.parent_id[0] : s.parent_id;
          if (!subtaskMap[pid]) subtaskMap[pid] = [];
          subtaskMap[pid].push({
            id: s.id,
            title: s.name,
            status: parseStatus(s.stage_id),
            assignees: (s.user_ids || []).map(uid => subUserMap[uid] || `Usuario ${uid}`),
          });
        });
      }

      // Nombres de encargados de tareas principales
      const mainUserIds = [...new Set(rawTasks.flatMap(t => t.user_ids || []))];
      let mainUserMap = {};
      if (mainUserIds.length > 0) {
        const mainUsers = await odooCall(sid, 'res.users', 'read',
          [mainUserIds, ['id', 'name']]
        );
        mainUsers.forEach(u => { mainUserMap[u.id] = u.name; });
      }

      // Construir tareas
      const tasks = rawTasks.map(t => ({
        id: t.id,
        title: t.name,
        status: parseStatus(t.stage_id),
        deadline: t.date_deadline || null,
        milestone_id:   Array.isArray(t.milestone_id) ? t.milestone_id[0] : null,
        milestone_name: Array.isArray(t.milestone_id) ? t.milestone_id[1] : null,
        assignees: (t.user_ids || []).map(uid => mainUserMap[uid] || `Usuario ${uid}`),
        subtasks: subtaskMap[t.id] || [],
      }));

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

      // Calcular progreso por milestone
      const milestones = Object.values(milestoneMap).map(m => {
        const { pct, inProgressPct } = calcProgress(m.tasks, m.tasks.length);
        return { ...m, progress: pct, inProgressPct };
      });

      // Progreso general = promedio de los porcentajes de cada milestone
      const totalMilestones = milestones.length;
      const overallPct = totalMilestones > 0
        ? Math.round(milestones.reduce((acc, m) => acc + m.progress, 0) / totalMilestones)
        : 0;
      const overallInProgress = totalMilestones > 0
        ? Math.round(milestones.reduce((acc, m) => acc + m.inProgressPct, 0) / totalMilestones)
        : 0;

      return {
        id: proj.id,
        name: proj.name,
        progress: overallPct,
        inProgressPct: overallInProgress,
        tasks,
        milestones,
      };
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
