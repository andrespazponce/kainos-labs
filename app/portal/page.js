'use client';
// app/portal/page.js
// Lista de proyectos del cliente. app/portal/layout.js garantiza que solo se
// llega acá con sesión de cliente (role === 'client'). Los datos vienen de
// /api/portal (todos los proyectos del cliente); al hacer click en uno se
// navega a /portal/[id], donde está el detalle + el chatter del proyecto.
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PortalListPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [portalData, setPortalData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

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

  const projects = portalData?.projects || [];

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
        .portal-list-header { margin-bottom: 24px; }
        .portal-list-company { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--text-primary); }
        .portal-list-sub { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
        .project-list { display: flex; flex-direction: column; gap: 14px; }
        .project-card {
          display: block; text-decoration: none;
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 24px 28px;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .project-card:hover {
          border-color: var(--blue-border);
          background: var(--bg-card-hover);
          transform: translateY(-2px);
        }
        .project-card-top {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-bottom: 16px;
        }
        .project-card-name { font-family: var(--font-display); font-size: 17px; font-weight: 700; color: var(--text-primary); }
        .project-card-badge {
          padding: 5px 12px; background: var(--blue-glow);
          border: 1px solid var(--blue-border); border-radius: 100px;
          font-family: var(--font-display); font-size: 13px; font-weight: 700;
          color: var(--blue-primary); white-space: nowrap; flex-shrink: 0;
        }
        .progress-track { height: 8px; background: var(--bg-elevated); border-radius: 100px; overflow: hidden; }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--blue-dim), var(--blue-primary), var(--blue-bright));
          border-radius: 100px;
          box-shadow: 0 0 12px var(--blue-glow);
        }
        .project-card-meta {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-top: 12px;
          font-size: 12px; color: var(--text-muted);
        }
        .project-card-cta { color: var(--blue-primary); font-weight: 600; }
        .tasks-empty { font-size: 13px; color: var(--text-muted); }
        .portal-empty-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 48px; text-align: center;
        }
        .dashboard-logout {
          margin-top: 28px; padding: 20px 4px 0;
          border-top: 1px solid var(--border-subtle);
          display: flex; justify-content: space-between; align-items: center;
        }
        .logout-note { font-size: 12px; color: var(--text-muted); }
        .logout-btn {
          padding: 8px 16px; background: transparent; border: 1px solid var(--border-card);
          border-radius: 8px; color: var(--text-secondary); font-size: 12px; font-weight: 500; cursor: pointer;
        }
        .logout-btn:hover { border-color: var(--blue-border); color: var(--text-primary); }
        @media (max-width: 600px) {
          .project-card { padding: 20px; }
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
              <>
                <div className="portal-list-header">
                  <div className="portal-list-company">{portalData.company}</div>
                  <div className="portal-list-sub">
                    {projects.length === 0
                      ? 'Tus proyectos'
                      : `${projects.length} proyecto${projects.length !== 1 ? 's' : ''} compartido${projects.length !== 1 ? 's' : ''} con tu cuenta`}
                  </div>
                </div>

                {projects.length === 0 ? (
                  <div className="portal-empty-card">
                    <p className="tasks-empty">Todavía no hay proyectos compartidos con tu cuenta. Contacta a tu gestor de proyecto en SagaSoft.</p>
                  </div>
                ) : (
                  <div className="project-list">
                    {projects.map((p) => {
                      const total = p.tasks.length;
                      const done = p.tasks.filter((t) => t.status === 'done').length;
                      return (
                        <Link key={p.id} href={`/portal/${p.id}`} className="project-card">
                          <div className="project-card-top">
                            <span className="project-card-name">{p.name}</span>
                            <span className="project-card-badge">{p.progress}%</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${p.progress}%` }} />
                          </div>
                          <div className="project-card-meta">
                            <span>{done} de {total} tarea{total !== 1 ? 's' : ''} completada{total !== 1 ? 's' : ''}</span>
                            <span className="project-card-cta">Ver proyecto →</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                <div className="dashboard-logout">
                  <span className="logout-note">Datos sincronizados con SagaSoft</span>
                  <button className="logout-btn" onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
