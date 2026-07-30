// app/api/portal/route.js
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { odooCallKw } from '@/lib/odoo';

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
    const projects = await odooCallKw(sid, 'project.project', 'search_read',
      [[['privacy_visibility', '!=', 'followers']]],
      { fields: ['id', 'name'], limit: 20 }
    );

    const result = await Promise.all(projects.map(async (proj) => {
      // Tareas principales — incluye description, user_id (responsable), user_ids (todos)
      const rawTasks = await odooCallKw(sid, 'project.task', 'search_read',
        [[['project_id', '=', proj.id], ['parent_id', '=', false]]],
        {
          fields: ['id', 'name', 'stage_id', 'date_deadline', 'milestone_id',
                   'user_id', 'user_ids', 'description'],
          order: 'milestone_id asc, date_deadline asc',
        }
      );

      const taskIds = rawTasks.map(t => t.id);

      // Resolver nombres de usuarios (responsable + asignados)
      const allUids = [...new Set(rawTasks.flatMap(t => [
        ...(Array.isArray(t.user_id) ? [t.user_id[0]] : t.user_id ? [t.user_id] : []),
        ...(t.user_ids || []),
      ]))];
      const userMap = {};
      if (allUids.length) {
        const users = await odooCallKw(sid, 'res.users', 'read', [allUids, ['id', 'name']]);
        users.forEach(u => { userMap[u.id] = u.name; });
      }

      // Subtareas — busca por parent_id in [taskIds]
      const subtaskMap = {};
      if (taskIds.length) {
        const rawSubs = await odooCallKw(sid, 'project.task', 'search_read',
          [[['parent_id', 'in', taskIds]]],
          { fields: ['id', 'name', 'stage_id', 'parent_id', 'user_id', 'user_ids', 'description'] }
        );

        // Resolver nombres adicionales que no estaban en tareas principales
        const subUids = [...new Set(rawSubs.flatMap(s => [
          ...(Array.isArray(s.user_id) ? [s.user_id[0]] : s.user_id ? [s.user_id] : []),
          ...(s.user_ids || []),
        ]))].filter(id => !userMap[id]);
        if (subUids.length) {
          const subUsers = await odooCallKw(sid, 'res.users', 'read', [subUids, ['id', 'name']]);
          subUsers.forEach(u => { userMap[u.id] = u.name; });
        }

        rawSubs.forEach(s => {
          const pid = Array.isArray(s.parent_id) ? s.parent_id[0] : s.parent_id;
          if (!subtaskMap[pid]) subtaskMap[pid] = [];
          subtaskMap[pid].push({
            id: s.id,
            title: s.name,
            status: parseStatus(s.stage_id),
            description: s.description || null,
            owner: Array.isArray(s.user_id) ? userMap[s.user_id[0]] || null : s.user_id ? userMap[s.user_id] || null : null,
            assignees: (s.user_ids || []).map(uid => ({ id: uid, name: userMap[uid] || `Usuario ${uid}` })),
          });
        });
      }

      // Construir tareas
      const tasks = rawTasks.map(t => {
        const ownerId = Array.isArray(t.user_id) ? t.user_id[0] : t.user_id || null;
        return {
          id: t.id,
          title: t.name,
          status: parseStatus(t.stage_id),
          deadline: t.date_deadline || null,
          description: t.description || null,
          milestone_id:   Array.isArray(t.milestone_id) ? t.milestone_id[0] : null,
          milestone_name: Array.isArray(t.milestone_id) ? t.milestone_id[1] : null,
          owner: ownerId ? userMap[ownerId] || null : null,
          assignees: (t.user_ids || []).map(uid => ({ id: uid, name: userMap[uid] || `Usuario ${uid}` })),
          subtasks: subtaskMap[t.id] || [],
        };
      });

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
      const overallPct        = totalMs ? Math.round(milestones.reduce((a, m) => a + m.progress, 0) / totalMs) : 0;
      const overallInProgress = totalMs ? Math.round(milestones.reduce((a, m) => a + m.inProgressPct, 0) / totalMs) : 0;

      // Lista plana de encargados únicos del proyecto (para filtros)
      const allAssignees = [...new Map(
        tasks.flatMap(t => [
          ...(t.owner ? [{ id: `owner-${t.owner}`, name: t.owner }] : []),
          ...t.assignees,
          ...t.subtasks.flatMap(s => [...(s.owner ? [{ id: `owner-${s.owner}`, name: s.owner }] : []), ...s.assignees]),
        ]).map(a => [a.name, a])
      ).values()];

      return { id: proj.id, name: proj.name, progress: overallPct, inProgressPct: overallInProgress, tasks, milestones, assignees: allAssignees };
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
