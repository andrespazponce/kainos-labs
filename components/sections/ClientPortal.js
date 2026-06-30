'use client';
// components/sections/ClientPortal.js
import { useState } from 'react';

const STATUS_CONFIG = {
  done: { label: 'Completado', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', dot: '#22c55e' },
  'in-progress': { label: 'En progreso', color: 'var(--blue-primary)', bg: 'var(--blue-glow)', dot: 'var(--blue-primary)' },
  pending: { label: 'Pendiente', color: '#555d6e', bg: 'rgba(85,93,110,0.1)', dot: '#555d6e' },
};

export default function ClientPortal() {
  const [code, setCode] = useState('');
  const [client, setClient] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressAnim, setProgressAnim] = useState(0);
  const [expandedTasks, setExpandedTasks] = useState({});

  const handleAccess = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        setError('Código inválido. Verifica el código proporcionado por KAINOS LABS.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setClient(data);
      setTimeout(() => setProgressAnim(data.progress), 300);
    } catch (e) {
      setError('Error de conexión. Intenta de nuevo en un momento.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAccess();
  };

  const formatCode = (val) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length <= 2) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
    if (clean.length <= 10) return `${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6)}`;
    return `${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
  };

  const toggleExpand = (taskId) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const tasksDone = client?.tasks.filter((t) => t.status === 'done').length || 0;
  const tasksTotal = client?.tasks.length || 0;

  return (
    <>
      <style>{`
        .portal-section {
          padding: 100px 0;
          background: linear-gradient(180deg, transparent 0%, var(--blue-glow) 50%, transparent 100%);
        }
        .portal-box { max-width: 760px; margin: 56px auto 0; }
        .portal-login {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 56px;
          text-align: center;
        }
        .portal-lock-icon {
          width: 56px; height: 56px;
          background: var(--blue-glow);
          border: 1px solid var(--blue-border);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: var(--blue-primary);
          margin: 0 auto 24px;
        }
        .portal-login-title {
          font-family: var(--font-display);
          font-size: 24px; font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .portal-login-sub {
          font-size: 14px; color: var(--text-secondary);
          margin-bottom: 36px; line-height: 1.6;
        }
        .portal-input-row { display: flex; gap: 12px; max-width: 420px; margin: 0 auto; }
        .portal-input {
          flex: 1; padding: 14px 18px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-card);
          border-radius: 10px;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: 15px; font-weight: 600; letter-spacing: 0.1em;
          outline: none; transition: border-color 0.2s; text-align: center;
        }
        .portal-input::placeholder { color: var(--text-muted); font-weight: 400; letter-spacing: 0.05em; font-size: 13px; }
        .portal-input:focus { border-color: var(--blue-primary); }
        .portal-input.error { border-color: #ef4444; }
        .portal-btn {
          padding: 14px 24px; background: var(--blue-primary); color: #000;
          border: none; border-radius: 10px;
          font-family: var(--font-display); font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.2s; white-space: nowrap; min-width: 100px;
        }
        .portal-btn:hover:not(:disabled) { background: var(--blue-bright); transform: translateY(-1px); }
        .portal-btn:disabled { opacity: 0.6; cursor: default; }
        .portal-error { margin-top: 16px; font-size: 13px; color: #ef4444; }
        .portal-hint { margin-top: 20px; font-size: 12px; color: var(--text-muted); }
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
        .progress-meta { display: flex; gap: 24px; margin-top: 12px; }
        .progress-meta-item { font-size: 12px; color: var(--text-muted); }
        .progress-meta-item strong { color: var(--text-secondary); }
        .dashboard-tasks { padding: 0 32px 32px; }
        .tasks-title {
          font-family: var(--font-display); font-size: 14px; font-weight: 600;
          color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase;
          padding: 24px 0 16px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 8px;
        }
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
          .portal-login { padding: 32px 24px; }
          .portal-input-row { flex-direction: column; }
          .dashboard-header, .dashboard-progress-section, .dashboard-tasks, .dashboard-logout { padding-left: 20px; padding-right: 20px; }
        }
      `}</style>

      <section className="portal-section" id="portal">
        <div className="container">
          <p className="section-label">Portal de Clientes</p>
          <h2 className="section-title">Seguimiento en tiempo real<br />de tu proyecto</h2>
          <p className="section-sub">Accede con tu código único para ver el avance de tu proyecto y el estado de cada tarea.</p>

          <div className="portal-box">
            {!client ? (
              <div className="portal-login">
                <div className="portal-lock-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h3 className="portal-login-title">Acceso exclusivo</h3>
                <p className="portal-login-sub">
                  Ingresa el código de acceso que KAINOS LABS te proporcionó<br />para ver el estado de tu proyecto.
                </p>

                <div className="portal-input-row">
                  <input
                    type="text"
                    className={`portal-input ${error ? 'error' : ''}`}
                    placeholder="KL-XXXX-XXXX"
                    value={code}
                    onChange={(e) => { setCode(formatCode(e.target.value)); setError(''); }}
                    onKeyDown={handleKeyDown}
                    maxLength={12}
                  />
                  <button className="portal-btn" onClick={handleAccess} disabled={loading || code.length < 10}>
                    {loading ? '...' : 'Ingresar'}
                  </button>
                </div>

                {error && <p className="portal-error">{error}</p>}
                <p className="portal-hint">¿No tienes tu código? Contacta a tu gestor de proyecto en KAINOS LABS.</p>
              </div>
            ) : (
              <div className="portal-dashboard">
                <div className="dashboard-header">
                  <div>
                    <div className="dashboard-company">{client.company}</div>
                    <div className="dashboard-project">{client.project}</div>
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
                    <div className="progress-meta-item"><strong>{client.tasks.filter(t => t.status === 'in-progress').length}</strong> en progreso</div>
                    <div className="progress-meta-item"><strong>{client.tasks.filter(t => t.status === 'pending').length}</strong> pendientes</div>
                  </div>
                </div>

                <div className="dashboard-tasks">
                  <div className="tasks-title">Tareas del proyecto</div>
                  {client.tasks.map((task) => {
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

                <div className="dashboard-logout">
                  <span className="logout-note">Datos sincronizados con KAINOS LABS</span>
                  <button className="logout-btn" onClick={() => { setClient(null); setCode(''); setProgressAnim(0); setExpandedTasks({}); }}>
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
