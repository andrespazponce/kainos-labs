import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

const ODOO_URL = process.env.ODOO_URL;

async function odooCall(sessionId, model, method, args, kwargs = {}) {
  const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `session_id=${sessionId}` },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', id: 1, params: { model, method, args, kwargs } }),
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

function calcProgress(tasks) {
  if (!tasks.length) return { pct: 0, inProgressPct: 0 };
  const w = 100 / tasks.length;
  return {
    pct: Math.round(tasks.filter(t => t.status === 'done').length * w),
    inProgressPct: Math.round(tasks.filter(t => t.status === 'in-progress').length * w),
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
      // Tareas principales
      const rawTasks = await odooCall(sid, 'project.task', 'search_read',
        [[['project_id', '=', proj.id], ['parent_id', '=', false]]],
        { fields: ['id', 'name', 'stage_id', 'date_deadline', 'milestone_id', 'user_ids'], order: 'milestone_id asc, date_deadline asc' }
      );

      const taskIds = rawTasks.map(t => t.id);

      // Nombres encargados de tareas principales
      const mainUids = [...new Set(rawTasks.flatMap(t => t.user_ids || []))];
      const mainUserMap = {};
      if (mainUids.length) {
        const users = await odooCall(sid, 'res.users', 'read', [mainUids, ['id', 'name']]);
        users.forEach(u => { mainUserMap[u.id] = u.name; });
      }

      // Subtareas — buscar por parent_id directo, más confiable que child_ids
      const subtaskMap = {};
      if (taskIds.length) {
        const rawSubs = await odooCall(sid, 'project.task', 'search_read',
          [[['parent_id', 'in', taskIds]]],
          { fields: ['id', 'name', 'stage_id', 'parent_id', 'user_ids'] }
        );

        // Nombres encargados de subtareas
        const subUids = [...new Set(rawSubs.flatMap(s => s.user_ids || []))];
        const subUserMap = { ...mainUserMap };
        if (subUids.filter(id => !subUserMap[id]).length) {
          const subUsers = await odooCall(sid, 'res.users', 'read',
            [subUids.filter(id => !subUserMap[id]), ['id', 'name']]
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

      // Construir tareas con subtareas
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
      const msMap = {};
      tasks.forEach(task => {
        const key   = task.milestone_id   ?? 'sin-milestone';
        const label = task.milestone_name ?? 'Sin objetivo asignado';
        if (!msMap[key]) msMap[key] = { id: key, name: label, tasks: [] };
        msMap[key].tasks.push(task);
      });

      const milestones = Object.values(msMap).map(m => {
        const { pct, inProgressPct } = calcProgress(m.tasks);
        return { ...m, progress: pct, inProgressPct };
      });

      const totalMs = milestones.length;
      const overallPct      = totalMs ? Math.round(milestones.reduce((a, m) => a + m.progress, 0) / totalMs) : 0;
      const overallInProgress = totalMs ? Math.round(milestones.reduce((a, m) => a + m.inProgressPct, 0) / totalMs) : 0;

      return { id: proj.id, name: proj.name, progress: overallPct, inProgressPct: overallInProgress, tasks, milestones };
    }));

    return NextResponse.json({ company: token.company || token.name || '', projects: result });

  } catch (err) {
    console.error('Portal error:', err.message);
    if (err.message?.toLowerCase().includes('session')) {
      return NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
    }
    return NextResponse.json({ error: 'ODOO_ERROR', detail: err.message }, { status: 500 });
  }
}
