'use client';
// app/portal/page.js
// Vista del cliente agrupada por milestones/objetivos de ODOO.

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const STATUS_CFG = {
  done:          { label: 'Completado',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  dot: '#22c55e' },
  'in-progress': { label: 'En progreso', color: 'var(--blue-primary)', bg: 'var(--blue-glow)', dot: 'var(--blue-primary)' },
  pending:       { label: 'Pendiente',   color: '#555d6e', bg: 'rgba(85,93,110,0.1)', dot: '#555d6e' },
};

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ProgressRing({ pct, size = 48, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--blue-primary)" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ fill: 'var(--text-primary)', fontSize: size * 0.26, fontWeight: 700, fontFamily: 'var(--font-display)', transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px` }}>
        {pct}%
      </text>
    </svg>
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
  const [openMilestones, setOpenMilestones] = useState({});
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
          // Abrir todos los milestones por defecto
          const open = {};
          (list[0].milestones || []).forEach(m => { open[m.id] = true; });
          setOpenMilestones(open);
        }
      })
      .catch(() => setError('Error de conexión con el servidor.'))
      .finally(() => setLoading(false));
  }, [status]);

  const selectProject = (p) => {
    setActiveProject(p);
    setOpenTasks({});
    const open = {};
    (p.milestones || []).forEach(m => { open[m.id] = true; });
    setOpenMilestones(open);
  };

  const toggleMilestone = (id) => setOpenMilestones(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleTask = (id) => setOpenTasks(prev => ({ ...prev, [id]: !prev[id] }));

  if (!mounted || status === 'loading') {
    return (
      <div suppressHydrationWarning style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', color:'var(--text-muted)', fontSize:'14px' }}>
        Cargando portal...
      </div>
    );
  }
  if (status !== 'authenticated') return null;

  const ms = activeProject?.milestones || [];

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
          background:rgba(15,16,20,0.9);
          backdrop-filter:blur(16px);
          border-bottom:1px solid var(--border-subtle);
        }
        .pp-brand { font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-primary); text-decoration:none; }
        .pp-brand span { color:var(--blue-primary); }
        .pp-top-right { display:flex; align-items:center; gap:14px; }
        .pp-user { font-size:13px; color:var(--text-secondary); }
        .pp-logout { padding:6px 14px; background:transparent; border:1px solid var(--border-card); border-radius:8px; color:var(--text-secondary); font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s; }
        .pp-logout:hover { border-color:var(--blue-border); color:var(--text-primary); }

        /* ── Body ── */
        .pp-body { flex:1; max-width:900px; margin:0 auto; width:100%; padding:40px 24px 80px; }

        /* ── Project selector ── */
        .pp-proj-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:32px; }
        .pp-proj-tab {
          padding:8px 18px;
          background:var(--bg-card); border:1px solid var(--border-card);
          border-radius:100px; font-size:13px; font-weight:500;
          color:var(--text-secondary); cursor:pointer; transition:all 0.2s;
        }
        .pp-proj-tab:hover { border-color:var(--blue-border); color:var(--text-primary); }
        .pp-proj-tab.active { background:var(--blue-glow); border-color:var(--blue-primary); color:var(--blue-primary); font-weight:600; }

        /* ── Project header ── */
        .pp-proj-header {
          display:flex; align-items:flex-start; justify-content:space-between;
          gap:24px; flex-wrap:wrap;
          background:var(--bg-card); border:1px solid var(--border-card);
          border-radius:var(--radius-card); padding:28px; margin-bottom:24px;
        }
        .pp-proj-name { font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--text-primary); margin-bottom:6px; line-height:1.3; }
        .pp-proj-meta { font-size:13px; color:var(--text-muted); }
        .pp-proj-meta span { color:var(--blue-primary); font-weight:600; }

        /* ── Overall progress bar ── */
        .pp-overall-bar { margin-top:16px; }
        .pp-bar-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .pp-bar-label { font-size:12px; color:var(--text-secondary); }
        .pp-bar-pct { font-family:var(--font-display); font-size:22px; font-weight:700; color:var(--blue-primary); line-height:1; }
        .pp-bar-track { height:6px; background:var(--bg-elevated); border-radius:100px; overflow:hidden; }
        .pp-bar-fill { height:100%; background:linear-gradient(90deg,var(--blue-dim),var(--blue-primary)); border-radius:100px; transition:width 1s ease; }

        /* ── Milestones section ── */
        .pp-ms-title { font-family:var(--font-display); font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-muted); margin-bottom:16px; }

        /* ── Milestone card ── */
        .pp-ms {
          background:var(--bg-card); border:1px solid var(--border-card);
          border-radius:var(--radius-card); margin-bottom:12px;
          overflow:hidden; transition:border-color 0.2s;
        }
        .pp-ms:hover { border-color:var(--blue-border); }
        .pp-ms-header {
          display:flex; align-items:center; gap:16px;
          padding:20px 24px; cursor:pointer;
          transition:background 0.15s;
        }
        .pp-ms-header:hover { background:var(--bg-card-hover); }
        .pp-ms-info { flex:1; min-width:0; }
        .pp-ms-name { font-family:var(--font-display); font-size:15px; font-weight:600; color:var(--text-primary); margin-bottom:4px; }
        .pp-ms-count { font-size:12px; color:var(--text-muted); }
        .pp-ms-count b { color:var(--blue-primary); }
        .pp-ms-chevron { color:var(--text-muted); transition:transform 0.25s; flex-shrink:0; }
        .pp-ms-chevron.open { transform:rotate(90deg); }

        /* ── Task list inside milestone ── */
        .pp-task-list { border-top:1px solid var(--border-subtle); }
        .pp-task {
          border-bottom:1px solid rgba(255,255,255,0.03);
        }
        .pp-task:last-child { border-bottom:none; }
        .pp-task-row {
          display:flex; align-items:center; gap:12px;
          padding:14px 24px; cursor:pointer;
          transition:background 0.15s;
        }
        .pp-task-row:hover { background:var(--bg-card-hover); }
        .pp-task-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .pp-task-text { flex:1; font-size:14px; color:var(--text-primary); line-height:1.4; }
        .pp-task-text.done { color:var(--text-muted); text-decoration:line-through; text-decoration-color:var(--text-muted); }
        .pp-task-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .pp-task-chip { padding:3px 10px; border-radius:100px; font-size:11px; font-weight:600; }
        .pp-task-date { font-size:11px; color:var(--text-muted); white-space:nowrap; }
        .pp-task-chevron { color:var(--text-muted); transition:transform 0.2s; flex-shrink:0; }
        .pp-task-chevron.open { transform:rotate(90deg); }

        /* ── Subtasks ── */
        .pp-subtasks { padding:0 24px 12px 52px; display:flex; flex-direction:column; gap:6px; }
        .pp-sub { display:flex; align-items:center; gap:8px; }
        .pp-sub-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .pp-sub-text { font-size:13px; color:var(--text-secondary); }
        .pp-sub-text.done { color:var(--text-muted); text-decoration:line-through; }

        /* ── Empty / loading / error ── */
        .pp-empty { text-align:center; padding:60px 0; color:var(--text-muted); font-size:13px; }
        .pp-error { text-align:center; padding:40px 0; color:#ef4444; font-size:13px; }

        @media (max-width:600px) {
          .pp-top { padding:12px 16px; }
          .pp-body { padding:24px 16px 60px; }
          .pp-proj-header { padding:20px; }
          .pp-ms-header { padding:16px 18px; }
          .pp-task-row { padding:12px 18px; }
          .pp-task-date { display:none; }
          .pp-subtasks { padding-left:36px; }
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
          {loading && <div className="pp-empty">Cargando proyectos desde ODOO...</div>}
          {error && <div className="pp-error">Error: {error}</div>}

          {!loading && !error && (
            <>
              {/* Selector de proyecto si hay más de uno */}
              {projects.length > 1 && (
                <div className="pp-proj-tabs">
                  {projects.map(p => (
                    <button key={p.id}
                      className={`pp-proj-tab ${activeProject?.id === p.id ? 'active' : ''}`}
                      onClick={() => selectProject(p)}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              {activeProject && (
                <>
                  {/* Header del proyecto */}
                  <div className="pp-proj-header">
                    <div style={{ flex: 1 }}>
                      <div className="pp-proj-name">{activeProject.name}</div>
                      <div className="pp-proj-meta">
                        {ms.length} objetivo{ms.length !== 1 ? 's' : ''} · {activeProject.tasks?.length || 0} tareas totales · <span>{activeProject.tasks?.filter(t => t.status === 'done').length || 0} completadas</span>
                      </div>
                      <div className="pp-overall-bar">
                        <div className="pp-bar-row">
                          <span className="pp-bar-label">Avance general del proyecto</span>
                          <span className="pp-bar-pct">{activeProject.progress}%</span>
                        </div>
                        <div className="pp-bar-track">
                          <div className="pp-bar-fill" style={{ width: `${activeProject.progress}%` }} />
                        </div>
                      </div>
                    </div>
                    <ProgressRing pct={activeProject.progress} size={72} stroke={6} />
                  </div>

                  {/* Milestones */}
                  {ms.length === 0 ? (
                    <div className="pp-empty">No hay objetivos configurados en este proyecto.</div>
                  ) : (
                    <>
                      <div className="pp-ms-title">Objetivos del proyecto</div>
                      {ms.map(milestone => {
                        const isOpen = openMilestones[milestone.id];
                        const done = milestone.tasks.filter(t => t.status === 'done').length;
                        return (
                          <div key={milestone.id} className="pp-ms">
                            {/* Header del milestone */}
                            <div className="pp-ms-header" onClick={() => toggleMilestone(milestone.id)}>
                              <ProgressRing pct={milestone.progress} size={48} stroke={4} />
                              <div className="pp-ms-info">
                                <div className="pp-ms-name">{milestone.name}</div>
                                <div className="pp-ms-count">
                                  <b>{done}</b> de {milestone.tasks.length} tareas completadas
                                </div>
                              </div>
                              <span className={`pp-ms-chevron ${isOpen ? 'open' : ''}`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
                              </span>
                            </div>

                            {/* Tareas del milestone */}
                            {isOpen && (
                              <div className="pp-task-list">
                                {milestone.tasks.map(task => {
                                  const st = STATUS_CFG[task.status] || STATUS_CFG.pending;
                                  const hasSub = task.subtasks?.length > 0;
                                  const taskOpen = openTasks[task.id];
                                  return (
                                    <div key={task.id} className="pp-task">
                                      <div className="pp-task-row" onClick={() => hasSub && toggleTask(task.id)}>
                                        <div className="pp-task-dot" style={{ background: st.dot }} />
                                        <span className={`pp-task-text ${task.status === 'done' ? 'done' : ''}`}>
                                          {task.title}
                                        </span>
                                        <div className="pp-task-right">
                                          {task.deadline && (
                                            <span className="pp-task-date">
                                              {fmtDate(task.deadline)}
                                            </span>
                                          )}
                                          <span className="pp-task-chip" style={{ color: st.color, background: st.bg }}>
                                            {st.label}
                                          </span>
                                          {hasSub && (
                                            <span className={`pp-task-chevron ${taskOpen ? 'open' : ''}`}>
                                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="9 18 15 12 9 6"/>
                                              </svg>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {hasSub && taskOpen && (
                                        <div className="pp-subtasks">
                                          {task.subtasks.map(s => {
                                            const sc = STATUS_CFG[s.status] || STATUS_CFG.pending;
                                            return (
                                              <div key={s.id} className="pp-sub">
                                                <span className="pp-sub-dot" style={{ background: sc.dot }} />
                                                <span className={`pp-sub-text ${s.status === 'done' ? 'done' : ''}`}>{s.title}</span>
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
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}

              {!activeProject && !loading && (
                <div className="pp-empty">No se encontraron proyectos en tu cuenta.</div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
