'use client';
// app/portal/page.js
// Dashboard del portal de clientes. app/portal/layout.js ya garantiza que
// solo se llega acá con sesión de cliente autenticada (role === 'client').
// Los datos vienen de /api/portal, que consulta Odoo con la sesión del
// propio usuario — cada cliente solo ve sus proyectos (ir.rules de Odoo).
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG = {
  done: { label: 'Completado', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', dot: '#22c55e' },
  'in-progress': { label: 'En progreso', color: 'var(--blue-primary)', bg: 'var(--blue-glow)', dot: 'var(--blue-primary)' },
  pending: { label: 'Pendiente', color: '#555d6e', bg: 'rgba(85,93,110,0.1)', dot: '#555d6e' },
};

export default function PortalDashboardPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [portalData, setPortalData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [progressAnim, setProgressAnim] = useState(0);
  const [expandedTasks, setExpandedTasks] = useState({});

  useEffect(() => {
    let cancelled = false;

    const fetchPortal = async () => {
      setLoadingData(true);
      try {
        const res = await fetch('/api/portal');
        if (res.status === 401) {
          // Sesión de Odoo expirada o token inválido → volver al login.
          await signOut({ redirect: false });
          router.push('/portal/login?expired=1');
          return;
        }
        if (!res.ok) {
          setError('No pudimos conectar con el sistema. Intenta más tarde.');
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setPortalData(data);
        const first = data.projects[0];
        setSelectedProjectId(first ? first.id : null);
        if (first) setTimeout(() => setProgressAnim(first.progress), 300);
      } catch {
        if (!cancelled) setError('Error de conexión. Intenta de nuevo en un momento.');
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    fetchPortal();
    return () => { cancelled = true; };
  }, [router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/portal/login');
  };

  const selectProject = (id) => {
    if (id === selectedProjectId) return;
    setSelectedProjectId(id);
    setExpandedTasks({});
    setProgressAnim(0);
    const proj = portalData?.projects.find((p) => p.id === id);
    if (proj) setTimeout(() => setProgressAnim(proj.progress), 150);
  };

  const toggleExpand = (taskId) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const projects = portalData?.projects || [];
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;
  const tasks = selectedProject?.tasks || [];
  const tasksDone = tasks.filter((t) => t.status === 'done').length;
  const tasksTotal = tasks.length;

  return (
    <>
      <style>{`
        .portal-page { padding: 100px 0; }
        .portal-box { max-width: 760px; margin: 0 auto; }
        .portal-loading, .portal-error-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 56px; text-align: center;
          color: var(--text-secondary); font-size: 14px;
        }
        .portal-dashboard {
          background: var(--bg-card);
          border: 1px solid var(--blue-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .project-pills {
          display: flex; gap: 8px; flex-wrap: wrap;
          padding: 20px 32px 0;
        }
        .project-pill {
          padding: 6px 14px; border-radius: 100px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          background: transparent;
          border: 1px solid var(--border-card);
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        .project-pill:hover { border-color: var(--blue-border); color: var(--text-primary); }
        .project-pill.active {
          background: var(--blue-glow);
          border-color: var(--blue-border);
          color: var(--blue-primary);
        }
        .dashboard-header {
          padding: 28px 32px; border-bottom: 1px solid var(--border-subtle);
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .dashboard-company { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--text-primary); }
        .dashboard-project { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
        .dashboard-status-badge {
          padding: 6px 14px; background: var(--blue-glow);
          border: 1px solid var(--blue-border); border-radius: 100px;
          font-size: 12px; font-weight: 600; color: var(--blue-primary);
        }
        .dashboard-progress-section { padding: 28px 32px; border-bottom: 1px solid var(--border-subtle); }
        .progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .progress-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
        .progress-percent { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--blue-primary); line-height: 1; }
        .progress-track { height: 8px; background: var(--bg-elevated); border-radius: 100px; overflow: hidden; }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--blue-dim), var(--blue-primary), var(--blue-bright));
          border-radius: 100px;
          transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 12px var(--blue-glow);
        }
        .progress-meta { display: flex; gap: 24px; margin-top: 12px; }
        .progress-meta-item { font-size: 12px; color: var(--text-muted); }
        .progress-meta-item strong { color: var(--text-secondary); }
        .dashboard-tasks { padding: 0 32px 32px; }
        .tasks-title {
          font-family: var(--font-display); font-size: 14px; font-weight: 600;
          color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase;
          padding: 24px 0 16px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 8px;
        }
        .tasks-empty { padding: 24px 0; font-size: 13px; color: var(--text-muted); }
        .task-card { border-bottom: 1px solid rgba(255,255,255,0.03); }
        .task-row { display: flex; align-items: center; gap: 14px; padding: 13px 0; cursor: pointer; }
        .task-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .task-text { flex: 1; font-size: 14px; color: var(--text-primary); line-height: 1.4; }
        .task-text.done { color: var(--text-muted); text-decoration: line-through; }
        .task-status-chip { padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
        .task-expand-icon { color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0; }
        .task-expand-icon.open { transform: rotate(90deg); }
        .subtask-list { padding: 0 0 14px 30px; display: flex; flex-direction: column; gap: 8px; }
        .subtask-row { display: flex; align-items: center; gap: 10px; }
        .subtask-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .subtask-text { font-size: 13px; color: var(--text-secondary); flex: 1; }
        .subtask-text.done { color: var(--text-muted); text-decoration: line-through; }
        .dashboard-logout {
          padding: 20px 32px; border-top: 1px solid var(--border-subtle);
          display: flex; justify-content: space-between; align-items: center;
        }
        .logout-note { font-size: 12px; color: var(--text-muted); }
        .logout-btn {
          padding: 8px 16px; background: transparent; border: 1px solid var(--border-card);
          border-radius: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 500; cursor: pointer;
        }
        .logout-btn:hover { border-color: var(--blue-border); color: var(--text-primary); }
        @media (max-width: 600px) {
          .dashboard-header, .dashboard-progress-section, .dashboard-tasks, .dashboard-logout { padding-left: 20px; padding-right: 20px; }
          .project-pills { padding-left: 20px; padding-right: 20px; }
        }
      `}</style>

      <section className="portal-page">
        <div className="container">
          <div className="portal-box">
            {loadingData ? (
              <div className="portal-loading">Cargando tus proyectos...</div>
            ) : error ? (
              <div className="portal-error-card">{error}</div>
            ) : (
              <div className="portal-dashboard">
                {projects.length > 1 && (
                  <div className="project-pills">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        className={`project-pill ${p.id === selectedProjectId ? 'active' : ''}`}
                        onClick={() => selectProject(p.id)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="dashboard-header">
                  <div>
                    <div className="dashboard-company">{portalData.company}</div>
                    <div className="dashboard-project">{selectedProject ? selectedProject.name : 'Sin proyectos'}</div>
                  </div>
                  <span className="dashboard-status-badge">En progreso</span>
                </div>

                {projects.length === 0 ? (
                  <div className="dashboard-tasks">
                    <p className="tasks-empty">Todavía no hay proyectos compartidos con tu cuenta. Contacta a tu gestor de proyecto en SagaSoft.</p>
                  </div>
                ) : (
                  <>
                    <div className="dashboard-progress-section">
                      <div className="progress-header">
                        <span className="progress-label">Avance general del proyecto</span>
                        <span className="progress-percent">{progressAnim}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progressAnim}%` }} />
                      </div>
                      <div className="progress-meta">
                        <div className="progress-meta-item"><strong>{tasksDone}</strong> de {tasksTotal} tareas completadas</div>
                        <div className="progress-meta-item"><strong>{tasks.filter(t => t.status === 'in-progress').length}</strong> en progreso</div>
                        <div className="progress-meta-item"><strong>{tasks.filter(t => t.status === 'pending').length}</strong> pendientes</div>
                      </div>
                    </div>

                    <div className="dashboard-tasks">
                      <div className="tasks-title">Tareas del proyecto</div>
                      {tasks.length === 0 && (
                        <p className="tasks-empty">Este proyecto todavía no tiene tareas visibles.</p>
                      )}
                      {tasks.map((task) => {
                        const st = STATUS_CONFIG[task.status];
                        const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                        const isOpen = expandedTasks[task.id];
                        return (
                          <div key={task.id} className="task-card">
                            <div className="task-row" onClick={() => hasSubtasks && toggleExpand(task.id)}>
                              <div className="task-dot" style={{ background: st.dot }} />
                              <span className={`task-text ${task.status === 'done' ? 'done' : ''}`}>{task.title}</span>
                              <span className="task-status-chip" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                              {hasSubtasks && (
                                <span className={`task-expand-icon ${isOpen ? 'open' : ''}`}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6"/>
                                  </svg>
                                </span>
                              )}
                            </div>
                            {hasSubtasks && isOpen && (
                              <div className="subtask-list">
                                {task.subtasks.map((st2) => {
                                  const stc = STATUS_CONFIG[st2.status];
                                  return (
                                    <div key={st2.id} className="subtask-row">
                                      <span className="subtask-dot" style={{ background: stc.dot }} />
                                      <span className={`subtask-text ${st2.status === 'done' ? 'done' : ''}`}>{st2.title}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="dashboard-logout">
                  <span className="logout-note">Datos sincronizados con SagaSoft</span>
                  <button className="logout-btn" onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
