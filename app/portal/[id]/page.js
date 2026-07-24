'use client';
// app/portal/[id]/page.js
// Detalle de un proyecto: cabecera, progreso y lista de tareas. Cada tarea es
// un link a su propia página (/portal/[id]/tasks/[taskId]), donde vive el
// chatter de esa tarea (como el portal nativo de Odoo). app/portal/layout.js
// garantiza sesión de cliente.
import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STATUS_CONFIG = {
  done: { label: 'Completado', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', dot: '#22c55e' },
  'in-progress': { label: 'En progreso', color: 'var(--blue-primary)', bg: 'var(--blue-glow)', dot: 'var(--blue-primary)' },
  pending: { label: 'Pendiente', color: '#555d6e', bg: 'rgba(85,93,110,0.1)', dot: '#555d6e' },
};

export default function PortalProjectPage({ params }) {
  const projectId = params.id;
  const router = useRouter();

  const [company, setCompany] = useState('');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectError, setProjectError] = useState(''); // '' | 'notfound' | 'generic'
  const [progressAnim, setProgressAnim] = useState(0);

  const handleAuthExpired = useCallback(async () => {
    await signOut({ redirect: false });
    router.push('/portal/login?expired=1');
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setProjectError('');
      try {
        const res = await fetch(`/api/portal/${projectId}`);
        if (res.status === 401) { await handleAuthExpired(); return; }
        if (res.status === 404) { if (!cancelled) setProjectError('notfound'); return; }
        if (!res.ok) { if (!cancelled) setProjectError('generic'); return; }
        const data = await res.json();
        if (cancelled) return;
        setCompany(data.company);
        setProject(data.project);
        setTimeout(() => { if (!cancelled) setProgressAnim(data.project.progress); }, 300);
      } catch {
        if (!cancelled) setProjectError('generic');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, handleAuthExpired]);

  const tasks = project?.tasks || [];
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
        .portal-back {
          display: inline-flex; align-items: center; gap: 6px; margin-bottom: 20px;
          font-size: 13px; color: var(--text-secondary); text-decoration: none;
          transition: color 0.2s;
        }
        .portal-back:hover { color: var(--text-primary); }
        .portal-dashboard {
          background: var(--bg-card);
          border: 1px solid var(--blue-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
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
        .progress-meta { display: flex; gap: 24px; margin-top: 12px; flex-wrap: wrap; }
        .progress-meta-item { font-size: 12px; color: var(--text-muted); }
        .progress-meta-item strong { color: var(--text-secondary); }
        .dashboard-tasks { padding: 0 32px 20px; }
        .tasks-title {
          font-family: var(--font-display); font-size: 14px; font-weight: 600;
          color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase;
          padding: 24px 0 8px; margin-bottom: 4px;
        }
        .tasks-empty { padding: 24px 0; font-size: 13px; color: var(--text-muted); }
        .task-link {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 0; text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: padding-left 0.15s;
        }
        .task-link:hover { padding-left: 6px; }
        .task-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .task-info { flex: 1; min-width: 0; }
        .task-text { font-size: 14px; color: var(--text-primary); line-height: 1.4; }
        .task-text.done { color: var(--text-muted); text-decoration: line-through; }
        .task-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .task-status-chip { padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
        .task-arrow { color: var(--text-muted); flex-shrink: 0; }
        .task-link:hover .task-arrow { color: var(--blue-primary); }
        .dashboard-footer {
          padding: 18px 32px; border-top: 1px solid var(--border-subtle);
          font-size: 12px; color: var(--text-muted);
        }
        @media (max-width: 600px) {
          .dashboard-header, .dashboard-progress-section, .dashboard-tasks, .dashboard-footer { padding-left: 20px; padding-right: 20px; }
        }
      `}</style>

      <section className="portal-page">
        <div className="container">
          <div className="portal-box">
            <Link href="/portal" className="portal-back">← Volver a mis proyectos</Link>

            {loading ? (
              <div className="portal-loading">Cargando el proyecto...</div>
            ) : projectError === 'notfound' ? (
              <div className="portal-error-card">Este proyecto no existe o no está compartido con tu cuenta.</div>
            ) : projectError ? (
              <div className="portal-error-card">No pudimos cargar el proyecto. Intenta más tarde.</div>
            ) : (
              <div className="portal-dashboard">
                <div className="dashboard-header">
                  <div>
                    <div className="dashboard-company">{company}</div>
                    <div className="dashboard-project">{project.name}</div>
                  </div>
                  <span className="dashboard-status-badge">En progreso</span>
                </div>

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
                    const subCount = task.subtasks ? task.subtasks.length : 0;
                    return (
                      <Link key={task.id} href={`/portal/${projectId}/tasks/${task.id}`} className="task-link">
                        <div className="task-dot" style={{ background: st.dot }} />
                        <div className="task-info">
                          <div className={`task-text ${task.status === 'done' ? 'done' : ''}`}>{task.title}</div>
                          <div className="task-sub">
                            {subCount > 0 ? `${subCount} subtarea${subCount !== 1 ? 's' : ''} · ` : ''}Abrir para ver y escribir mensajes
                          </div>
                        </div>
                        <span className="task-status-chip" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                        <span className="task-arrow">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </span>
                      </Link>
                    );
                  })}
                </div>

                <div className="dashboard-footer">Datos sincronizados con SagaSoft</div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
