'use client';
// app/portal/page.js — v2
// Objetivos horizontales, progreso ponderado, encargados, subtareas expandibles.

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const STATUS_CFG = {
  done:          { label: 'Completado',  dot: '#22c55e',           chip: { color: '#22c55e',           bg: 'rgba(34,197,94,0.12)'  } },
  'in-progress': { label: 'En progreso', dot: 'var(--blue-primary)', chip: { color: 'var(--blue-primary)', bg: 'var(--blue-glow)'       } },
  pending:       { label: 'Pendiente',   dot: '#555d6e',           chip: { color: '#555d6e',           bg: 'rgba(85,93,110,0.1)'   } },
};

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Avatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <span title={name} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: '50%',
      background: `hsl(${hue},55%,35%)`,
      color: '#fff', fontSize: 9, fontWeight: 700,
      border: '1.5px solid var(--bg-card)', flexShrink: 0,
    }}>
      {initials}
    </span>
  );
}

// Barra de progreso compuesta: done (sólido) + in-progress (semitransparente)
function ComboBar({ pct, inProgressPct, height = 6 }) {
  return (
    <div style={{
      position: 'relative', height, borderRadius: 100,
      background: 'var(--bg-elevated)', overflow: 'hidden',
    }}>
      {/* Bloque in-progress (debajo, semitransparente) */}
      {inProgressPct > 0 && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${Math.min(pct + inProgressPct, 100)}%`,
          background: 'var(--blue-primary)',
          opacity: 0.25,
          borderRadius: 100,
          transition: 'width 1s ease',
        }} />
      )}
      {/* Bloque done (encima, sólido) */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${pct}%`,
        background: 'linear-gradient(90deg, var(--blue-dim), var(--blue-primary))',
        borderRadius: 100,
        transition: 'width 1s ease',
        boxShadow: pct > 0 ? '0 0 8px rgba(0,174,239,0.4)' : 'none',
      }} />
    </div>
  );
}

export default function PortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeMilestone, setActiveMilestone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openTasks, setOpenTasks] = useState({});

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (status === 'unauthenticated') router.replace('/#portal');
  }, [mounted, status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoading(true);
    fetch('/api/portal')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        const list = data.projects || [];
        setProjects(list);
        if (list.length > 0) {
          setActiveProject(list[0]);
          setActiveMilestone(list[0].milestones?.[0] || null);
        }
      })
      .catch(() => setError('Error de conexión con el servidor.'))
      .finally(() => setLoading(false));
  }, [status]);

  const selectProject = (p) => {
    setActiveProject(p);
    setActiveMilestone(p.milestones?.[0] || null);
    setOpenTasks({});
  };

  const toggleTask = (id) => setOpenTasks(prev => ({ ...prev, [id]: !prev[id] }));

  if (!mounted || status === 'loading') {
    return (
      <div suppressHydrationWarning style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-primary)',
        color: 'var(--text-muted)', fontSize: 14,
      }}>
        Cargando portal...
      </div>
    );
  }
  if (status !== 'authenticated') return null;

  const ms = activeProject?.milestones || [];
  const tasks = activeMilestone?.tasks || [];

  return (
    <>
      <style>{`
        /* ── Layout ── */
        .pp { min-height:100vh; background:var(--bg-primary); display:flex; flex-direction:column; }

        /* ── Topbar ── */
        .pp-top {
          position:sticky; top:0; z-index:50;
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 32px;
          background:rgba(15,16,20,0.92); backdrop-filter:blur(16px);
          border-bottom:1px solid var(--border-subtle);
        }
        .pp-brand { font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-primary); text-decoration:none; }
        .pp-brand span { color:var(--blue-primary); }
        .pp-top-right { display:flex; align-items:center; gap:14px; }
        .pp-user { font-size:13px; color:var(--text-secondary); }
        .pp-logout { padding:6px 14px; background:transparent; border:1px solid var(--border-card); border-radius:8px; color:var(--text-secondary); font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s; }
        .pp-logout:hover { border-color:var(--blue-border); color:var(--text-primary); }

        /* ── Body ── */
        .pp-body { flex:1; max-width:960px; margin:0 auto; width:100%; padding:36px 24px 80px; }

        /* ── Selector de proyecto ── */
        .pp-proj-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:28px; }
        .pp-proj-tab { padding:7px 16px; background:var(--bg-card); border:1px solid var(--border-card); border-radius:100px; font-size:13px; font-weight:500; color:var(--text-secondary); cursor:pointer; transition:all 0.2s; }
        .pp-proj-tab:hover { border-color:var(--blue-border); color:var(--text-primary); }
        .pp-proj-tab.active { background:var(--blue-glow); border-color:var(--blue-primary); color:var(--blue-primary); font-weight:600; }

        /* ── Cabecera del proyecto ── */
        .pp-proj-header { background:var(--bg-card); border:1px solid var(--border-card); border-radius:var(--radius-card); padding:24px 28px; margin-bottom:28px; }
        .pp-proj-name { font-family:var(--font-display); font-size:19px; font-weight:700; color:var(--text-primary); margin-bottom:4px; }
        .pp-proj-meta { font-size:12px; color:var(--text-muted); margin-bottom:14px; }
        .pp-proj-meta b { color:var(--blue-primary); }
        .pp-bar-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
        .pp-bar-label { font-size:12px; color:var(--text-secondary); }
        .pp-bar-pct { font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--blue-primary); line-height:1; }
        .pp-bar-legend { display:flex; gap:16px; margin-top:8px; }
        .pp-bar-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-muted); }
        .pp-legend-dot { width:8px; height:8px; border-radius:50%; }

        /* ── Sección de objetivos ── */
        .pp-ms-section { margin-bottom:28px; }
        .pp-ms-section-title { font-family:var(--font-display); font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-muted); margin-bottom:14px; }

        /* ── Carrusel horizontal de milestones ── */
        .pp-ms-scroll {
          display:flex; gap:12px; overflow-x:auto; padding-bottom:8px;
          scrollbar-width:thin; scrollbar-color:var(--blue-dim) transparent;
        }
        .pp-ms-scroll::-webkit-scrollbar { height:3px; }
        .pp-ms-scroll::-webkit-scrollbar-track { background:transparent; }
        .pp-ms-scroll::-webkit-scrollbar-thumb { background:var(--blue-dim); border-radius:100px; }

        /* ── Tarjeta de milestone ── */
        .pp-ms-card {
          flex-shrink:0; width:220px;
          background:var(--bg-card); border:1px solid var(--border-card);
          border-radius:14px; padding:18px 18px 16px;
          cursor:pointer; transition:all 0.2s;
          display:flex; flex-direction:column; gap:10px;
        }
        .pp-ms-card:hover { border-color:var(--blue-border); transform:translateY(-2px); }
        .pp-ms-card.active { border-color:var(--blue-primary); background:linear-gradient(135deg,var(--bg-card),rgba(0,174,239,0.05)); }
        .pp-ms-card-name { font-family:var(--font-display); font-size:13px; font-weight:600; color:var(--text-primary); line-height:1.35; }
        .pp-ms-card-count { font-size:11px; color:var(--text-muted); }
        .pp-ms-card-count b { color:var(--blue-primary); }
        .pp-ms-pct-row { display:flex; justify-content:space-between; align-items:center; }
        .pp-ms-pct-num { font-family:var(--font-display); font-size:18px; font-weight:700; color:var(--blue-primary); line-height:1; }
        .pp-ms-pct-sub { font-size:10px; color:var(--text-muted); }

        /* ── Lista de tareas ── */
        .pp-task-section-title { font-family:var(--font-display); font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-muted); margin-bottom:12px; }
        .pp-task-list { display:flex; flex-direction:column; gap:8px; }
        .pp-task-card { background:var(--bg-card); border:1px solid var(--border-card); border-radius:12px; overflow:hidden; transition:border-color 0.2s; }
        .pp-task-card:hover { border-color:var(--blue-border); }

        /* ── Fila principal de tarea ── */
        .pp-task-row {
          display:flex; align-items:flex-start; gap:12px;
          padding:14px 18px; cursor:pointer;
        }
        .pp-task-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:4px; }
        .pp-task-body { flex:1; min-width:0; }
        .pp-task-title { font-size:14px; color:var(--text-primary); line-height:1.4; margin-bottom:6px; }
        .pp-task-title.done { color:var(--text-muted); text-decoration:line-through; }
        .pp-task-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .pp-task-chip { padding:2px 9px; border-radius:100px; font-size:11px; font-weight:600; }
        .pp-task-date { font-size:11px; color:var(--text-muted); }
        .pp-task-assignees { display:flex; align-items:center; gap:3px; }
        .pp-task-assignee-name { font-size:11px; color:var(--text-muted); max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .pp-task-chevron { color:var(--text-muted); transition:transform 0.2s; flex-shrink:0; margin-top:2px; }
        .pp-task-chevron.open { transform:rotate(90deg); }

        /* ── Subtareas ── */
        .pp-subtasks { border-top:1px solid var(--border-subtle); padding:10px 18px 14px 38px; display:flex; flex-direction:column; gap:8px; }
        .pp-subtask-row { display:flex; align-items:flex-start; gap:8px; }
        .pp-sub-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; margin-top:4px; }
        .pp-sub-body { flex:1; min-width:0; }
        .pp-sub-title { font-size:13px; color:var(--text-secondary); line-height:1.4; margin-bottom:3px; }
        .pp-sub-title.done { color:var(--text-muted); text-decoration:line-through; }
        .pp-sub-meta { display:flex; align-items:center; gap:8px; }

        /* ── Empty / error ── */
        .pp-empty { text-align:center; padding:60px 0; color:var(--text-muted); font-size:13px; }
        .pp-error { text-align:center; padding:40px 0; color:#ef4444; font-size:13px; }

        @media (max-width:600px) {
          .pp-top { padding:12px 16px; }
          .pp-body { padding:20px 14px 60px; }
          .pp-proj-header { padding:18px; }
          .pp-ms-card { width:180px; }
          .pp-task-row { padding:12px 14px; }
          .pp-subtasks { padding-left:28px; }
        }
      `}</style>

      <div className="pp">
        {/* ── Topbar ── */}
        <div className="pp-top">
          <a href="/" className="pp-brand">Saga<span>Soft</span></a>
          <div className="pp-top-right">
            <span className="pp-user">{session.user?.name || session.user?.email}</span>
            <button className="pp-logout" onClick={() => signOut({ callbackUrl: '/' })}>
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="pp-body">
          {loading && <div className="pp-empty">Cargando desde ODOO...</div>}
          {error   && <div className="pp-error">Error: {error}</div>}

          {!loading && !error && activeProject && (
            <>
              {/* Selector de proyecto */}
              {projects.length > 1 && (
                <div className="pp-proj-tabs">
                  {projects.map(p => (
                    <button key={p.id}
                      className={`pp-proj-tab ${activeProject.id === p.id ? 'active' : ''}`}
                      onClick={() => selectProject(p)}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Cabecera del proyecto ── */}
              <div className="pp-proj-header">
                <div className="pp-proj-name">{activeProject.name}</div>
                <div className="pp-proj-meta">
                  <b>{ms.length}</b> objetivo{ms.length !== 1 ? 's' : ''} · <b>{activeProject.tasks?.length || 0}</b> tareas totales
                </div>
                <div className="pp-bar-row">
                  <span className="pp-bar-label">Avance general del proyecto</span>
                  <span className="pp-bar-pct">
                    {activeProject.progress}
                    {activeProject.inProgressPct > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
                        {' '}+{activeProject.inProgressPct}% en curso
                      </span>
                    )}%
                  </span>
                </div>
                <ComboBar pct={activeProject.progress} inProgressPct={activeProject.inProgressPct} height={8} />
                <div className="pp-bar-legend">
                  <div className="pp-bar-legend-item">
                    <div className="pp-legend-dot" style={{ background: 'var(--blue-primary)' }} />
                    Completado
                  </div>
                  <div className="pp-bar-legend-item">
                    <div className="pp-legend-dot" style={{ background: 'var(--blue-primary)', opacity: 0.3 }} />
                    En progreso
                  </div>
                </div>
              </div>

              {/* ── Objetivos horizontales ── */}
              <div className="pp-ms-section">
                <div className="pp-ms-section-title">Objetivos del proyecto</div>
                <div className="pp-ms-scroll">
                  {ms.map(milestone => {
                    const isActive = activeMilestone?.id === milestone.id;
                    const done = milestone.tasks.filter(t => t.status === 'done').length;
                    const inProg = milestone.tasks.filter(t => t.status === 'in-progress').length;
                    return (
                      <div key={milestone.id}
                        className={`pp-ms-card ${isActive ? 'active' : ''}`}
                        onClick={() => { setActiveMilestone(milestone); setOpenTasks({}); }}>
                        <div className="pp-ms-card-name">{milestone.name}</div>
                        <div className="pp-ms-pct-row">
                          <div>
                            <div className="pp-ms-pct-num">{milestone.progress}%</div>
                            <div className="pp-ms-pct-sub">
                              {done}/{milestone.tasks.length} completadas
                              {inProg > 0 && ` · ${inProg} en curso`}
                            </div>
                          </div>
                        </div>
                        <ComboBar pct={milestone.progress} inProgressPct={milestone.inProgressPct} height={5} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Tareas del milestone activo ── */}
              {activeMilestone && (
                <>
                  <div className="pp-task-section-title">
                    Tareas — {activeMilestone.name}
                  </div>
                  {tasks.length === 0 ? (
                    <div className="pp-empty">No hay tareas en este objetivo.</div>
                  ) : (
                    <div className="pp-task-list">
                      {tasks.map(task => {
                        const st = STATUS_CFG[task.status] || STATUS_CFG.pending;
                        const hasSub = task.subtasks?.length > 0;
                        const isOpen = openTasks[task.id];
                        return (
                          <div key={task.id} className="pp-task-card">
                            <div className="pp-task-row" onClick={() => hasSub && toggleTask(task.id)}>
                              <div className="pp-task-dot" style={{ background: st.dot }} />
                              <div className="pp-task-body">
                                <div className={`pp-task-title ${task.status === 'done' ? 'done' : ''}`}>
                                  {task.title}
                                </div>
                                <div className="pp-task-meta">
                                  <span className="pp-task-chip" style={{ color: st.chip.color, background: st.chip.bg }}>
                                    {st.label}
                                  </span>
                                  {task.deadline && (
                                    <span className="pp-task-date">📅 {fmtDate(task.deadline)}</span>
                                  )}
                                  {task.assignees?.length > 0 && (
                                    <div className="pp-task-assignees">
                                      {task.assignees.slice(0, 3).map(a => <Avatar key={a} name={a} />)}
                                      <span className="pp-task-assignee-name">
                                        {task.assignees[0]}{task.assignees.length > 1 ? ` +${task.assignees.length - 1}` : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {hasSub && (
                                <div className={`pp-task-chevron ${isOpen ? 'open' : ''}`}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6"/>
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Subtareas */}
                            {hasSub && isOpen && (
                              <div className="pp-subtasks">
                                {task.subtasks.map(sub => {
                                  const sst = STATUS_CFG[sub.status] || STATUS_CFG.pending;
                                  return (
                                    <div key={sub.id} className="pp-subtask-row">
                                      <div className="pp-sub-dot" style={{ background: sst.dot }} />
                                      <div className="pp-sub-body">
                                        <div className={`pp-sub-title ${sub.status === 'done' ? 'done' : ''}`}>
                                          {sub.title}
                                        </div>
                                        <div className="pp-sub-meta">
                                          <span className="pp-task-chip" style={{ color: sst.chip.color, background: sst.chip.bg, padding: '1px 7px', fontSize: 10 }}>
                                            {sst.label}
                                          </span>
                                          {sub.assignees?.length > 0 && (
                                            <div className="pp-task-assignees">
                                              {sub.assignees.slice(0, 2).map(a => <Avatar key={a} name={a} />)}
                                              <span className="pp-task-assignee-name">{sub.assignees[0]}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
