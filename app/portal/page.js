'use client';
// app/portal/page.js — v3
// - Contenido a pantalla completa (sin max-width restrictivo)
// - Tareas visibles por defecto bajo cada objetivo
// - Solo subtareas son expandibles

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const STATUS_CFG = {
  done:          { label: 'Completado',  dot: '#22c55e',            chip: { color: '#22c55e',            bg: 'rgba(34,197,94,0.12)'  } },
  'in-progress': { label: 'En progreso', dot: 'var(--blue-primary)', chip: { color: 'var(--blue-primary)', bg: 'var(--blue-glow)'      } },
  pending:       { label: 'Pendiente',   dot: '#555d6e',            chip: { color: '#555d6e',            bg: 'rgba(85,93,110,0.1)'   } },
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
      width: 20, height: 20, borderRadius: '50%',
      background: `hsl(${hue},55%,35%)`,
      color: '#fff', fontSize: 8, fontWeight: 700,
      border: '1.5px solid var(--bg-card)', flexShrink: 0,
    }}>
      {initials}
    </span>
  );
}

function ComboBar({ pct, inProgressPct, height = 6 }) {
  return (
    <div style={{ position: 'relative', height, borderRadius: 100, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
      {inProgressPct > 0 && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${Math.min(pct + inProgressPct, 100)}%`,
          background: 'var(--blue-primary)', opacity: 0.25,
          borderRadius: 100, transition: 'width 1s ease',
        }} />
      )}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${pct}%`,
        background: 'linear-gradient(90deg, var(--blue-dim), var(--blue-primary))',
        borderRadius: 100, transition: 'width 1s ease',
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openSubtasks, setOpenSubtasks] = useState({});

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
        if (list.length > 0) setActiveProject(list[0]);
      })
      .catch(() => setError('Error de conexión con el servidor.'))
      .finally(() => setLoading(false));
  }, [status]);

  const toggleSubtasks = (id) => setOpenSubtasks(prev => ({ ...prev, [id]: !prev[id] }));

  if (!mounted || status === 'loading') {
    return (
      <div suppressHydrationWarning style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: 14 }}>
        Cargando portal...
      </div>
    );
  }
  if (status !== 'authenticated') return null;

  const ms = activeProject?.milestones || [];

  return (
    <>
      <style>{`
        .pp { min-height:100vh; background:var(--bg-primary); display:flex; flex-direction:column; }

        /* Topbar */
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

        /* Body — ancho completo con padding generoso */
        .pp-body { flex:1; width:100%; padding:32px 40px 80px; box-sizing:border-box; }

        /* Selector de proyecto */
        .pp-proj-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
        .pp-proj-tab { padding:7px 16px; background:var(--bg-card); border:1px solid var(--border-card); border-radius:100px; font-size:13px; font-weight:500; color:var(--text-secondary); cursor:pointer; transition:all 0.2s; }
        .pp-proj-tab:hover { border-color:var(--blue-border); color:var(--text-primary); }
        .pp-proj-tab.active { background:var(--blue-glow); border-color:var(--blue-primary); color:var(--blue-primary); font-weight:600; }

        /* Cabecera proyecto */
        .pp-proj-header { background:var(--bg-card); border:1px solid var(--border-card); border-radius:var(--radius-card); padding:24px 28px; margin-bottom:28px; }
        .pp-proj-name { font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--text-primary); margin-bottom:4px; }
        .pp-proj-meta { font-size:12px; color:var(--text-muted); margin-bottom:14px; }
        .pp-proj-meta b { color:var(--blue-primary); }
        .pp-bar-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
        .pp-bar-label { font-size:12px; color:var(--text-secondary); }
        .pp-bar-pct { font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--blue-primary); line-height:1; }
        .pp-bar-legend { display:flex; gap:16px; margin-top:8px; }
        .pp-bar-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-muted); }
        .pp-legend-dot { width:8px; height:8px; border-radius:50%; }

        /* Sección objetivos */
        .pp-ms-section-title { font-family:var(--font-display); font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-muted); margin-bottom:16px; }

        /* Grid de objetivos — usa todo el ancho disponible */
        .pp-ms-grid {
          display:grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap:16px;
          margin-bottom:0;
        }

        /* Tarjeta de objetivo */
        .pp-ms-card {
          background:var(--bg-card); border:1px solid var(--border-card);
          border-radius:16px; padding:20px;
          display:flex; flex-direction:column; gap:12px;
        }

        /* Cabecera del objetivo */
        .pp-ms-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .pp-ms-name { font-family:var(--font-display); font-size:14px; font-weight:600; color:var(--text-primary); line-height:1.35; flex:1; }
        .pp-ms-pct-block { text-align:right; flex-shrink:0; }
        .pp-ms-pct-num { font-family:var(--font-display); font-size:22px; font-weight:700; color:var(--blue-primary); line-height:1; }
        .pp-ms-pct-sub { font-size:10px; color:var(--text-muted); margin-top:2px; }

        /* Lista de tareas dentro del objetivo */
        .pp-task-list { display:flex; flex-direction:column; gap:6px; border-top:1px solid var(--border-subtle); padding-top:12px; }
        .pp-task-item { background:var(--bg-elevated); border-radius:10px; overflow:hidden; }

        /* Fila de tarea */
        .pp-task-row { display:flex; align-items:flex-start; gap:10px; padding:10px 12px; }
        .pp-task-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; margin-top:4px; }
        .pp-task-body { flex:1; min-width:0; }
        .pp-task-title { font-size:13px; color:var(--text-primary); line-height:1.4; margin-bottom:5px; }
        .pp-task-title.done { color:var(--text-muted); text-decoration:line-through; }
        .pp-task-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .pp-task-chip { padding:2px 8px; border-radius:100px; font-size:10px; font-weight:600; }
        .pp-task-date { font-size:10px; color:var(--text-muted); }
        .pp-task-assignees { display:flex; align-items:center; gap:3px; }
        .pp-task-aname { font-size:10px; color:var(--text-muted); max-width:100px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        /* Botón expandir subtareas */
        .pp-sub-toggle {
          display:flex; align-items:center; gap:5px;
          padding:4px 12px 8px;
          font-size:10px; color:var(--text-muted); cursor:pointer;
          background:none; border:none; transition:color 0.2s;
        }
        .pp-sub-toggle:hover { color:var(--blue-primary); }
        .pp-sub-chevron { transition:transform 0.2s; }
        .pp-sub-chevron.open { transform:rotate(90deg); }

        /* Subtareas */
        .pp-subtasks { padding:0 12px 10px 28px; display:flex; flex-direction:column; gap:6px; border-top:1px solid rgba(255,255,255,0.04); margin-top:2px; padding-top:8px; }
        .pp-sub-row { display:flex; align-items:flex-start; gap:7px; }
        .pp-sub-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; margin-top:4px; }
        .pp-sub-body { flex:1; min-width:0; }
        .pp-sub-title { font-size:12px; color:var(--text-secondary); line-height:1.4; margin-bottom:3px; }
        .pp-sub-title.done { color:var(--text-muted); text-decoration:line-through; }
        .pp-sub-meta { display:flex; align-items:center; gap:6px; }

        /* Estados */
        .pp-empty { text-align:center; padding:60px 0; color:var(--text-muted); font-size:13px; }
        .pp-error { text-align:center; padding:40px 0; color:#ef4444; font-size:13px; }

        @media (max-width:768px) {
          .pp-body { padding:20px 16px 60px; }
          .pp-top { padding:12px 16px; }
          .pp-ms-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="pp">
        {/* Topbar */}
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
                      onClick={() => { setActiveProject(p); setOpenSubtasks({}); }}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Cabecera del proyecto */}
              <div className="pp-proj-header">
                <div className="pp-proj-name">{activeProject.name}</div>
                <div className="pp-proj-meta">
                  <b>{ms.length}</b> objetivo{ms.length !== 1 ? 's' : ''} · <b>{activeProject.tasks?.length || 0}</b> tareas totales
                </div>
                <div className="pp-bar-row">
                  <span className="pp-bar-label">Avance general del proyecto</span>
                  <span className="pp-bar-pct">
                    {activeProject.progress}%
                    {activeProject.inProgressPct > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                        {' '}· {activeProject.inProgressPct}% en curso
                      </span>
                    )}
                  </span>
                </div>
                <ComboBar pct={activeProject.progress} inProgressPct={activeProject.inProgressPct} height={7} />
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

              {/* Grid de objetivos a pantalla completa */}
              {ms.length === 0 ? (
                <div className="pp-empty">No hay objetivos configurados en este proyecto.</div>
              ) : (
                <>
                  <div className="pp-ms-section-title">Objetivos del proyecto</div>
                  <div className="pp-ms-grid">
                    {ms.map(milestone => {
                      const done   = milestone.tasks.filter(t => t.status === 'done').length;
                      const inProg = milestone.tasks.filter(t => t.status === 'in-progress').length;

                      return (
                        <div key={milestone.id} className="pp-ms-card">
                          {/* Cabecera del objetivo */}
                          <div className="pp-ms-head">
                            <div className="pp-ms-name">{milestone.name}</div>
                            <div className="pp-ms-pct-block">
                              <div className="pp-ms-pct-num">{milestone.progress}%</div>
                              <div className="pp-ms-pct-sub">
                                {done}/{milestone.tasks.length} completadas
                              </div>
                            </div>
                          </div>

                          <ComboBar pct={milestone.progress} inProgressPct={milestone.inProgressPct} height={5} />

                          {inProg > 0 && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {inProg} tarea{inProg !== 1 ? 's' : ''} en curso
                            </div>
                          )}

                          {/* Tareas — visibles por defecto, sin click necesario */}
                          <div className="pp-task-list">
                            {milestone.tasks.map(task => {
                              const st = STATUS_CFG[task.status] || STATUS_CFG.pending;
                              const hasSub = task.subtasks?.length > 0;
                              const subOpen = openSubtasks[task.id];

                              return (
                                <div key={task.id} className="pp-task-item">
                                  <div className="pp-task-row">
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
                                          <span className="pp-task-date">{fmtDate(task.deadline)}</span>
                                        )}
                                        {task.assignees?.length > 0 && (
                                          <div className="pp-task-assignees">
                                            {task.assignees.slice(0, 3).map(a => <Avatar key={a} name={a} />)}
                                            <span className="pp-task-aname">
                                              {task.assignees[0]}{task.assignees.length > 1 ? ` +${task.assignees.length - 1}` : ''}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Botón expandir subtareas — solo si las hay */}
                                  {hasSub && (
                                    <button className="pp-sub-toggle" onClick={() => toggleSubtasks(task.id)}>
                                      <svg className={`pp-sub-chevron ${subOpen ? 'open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="9 18 15 12 9 6"/>
                                      </svg>
                                      {subOpen ? 'Ocultar' : 'Ver'} {task.subtasks.length} subtarea{task.subtasks.length !== 1 ? 's' : ''}
                                    </button>
                                  )}

                                  {/* Subtareas expandibles */}
                                  {hasSub && subOpen && (
                                    <div className="pp-subtasks">
                                      {task.subtasks.map(sub => {
                                        const sst = STATUS_CFG[sub.status] || STATUS_CFG.pending;
                                        return (
                                          <div key={sub.id} className="pp-sub-row">
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
                                                    <span className="pp-task-aname">{sub.assignees[0]}</span>
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
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
