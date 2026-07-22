'use client';
// app/admin/layout.js
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';
  const [mounted, setMounted] = useState(false);

  // Evita mismatch de hidratación: el servidor nunca conoce el estado de
  // sesión, así que esperamos a estar montados en el cliente antes de
  // renderizar cualquier cosa que dependa de useSession().
  useEffect(() => {
    setMounted(true);
  }, []);

  // Los clientes del portal también tienen sesión (odoo-credentials), pero
  // solo los admins (role === 'admin') pueden ver este panel.
  const isAdmin = status === 'authenticated' && session?.user?.role === 'admin';

  useEffect(() => {
    if (!mounted) return;
    if (isLoginPage) return;
    if (status === 'unauthenticated' || (status === 'authenticated' && !isAdmin)) {
      router.replace('/admin/login');
    }
  }, [mounted, status, isAdmin, isLoginPage, router]);

  if (isLoginPage) {
    return children;
  }

  if (!mounted || status === 'loading') {
    return (
      <div suppressHydrationWarning style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
        Verificando acceso...
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <style>{`
        .admin-shell {
          min-height: 100vh;
          background: var(--bg-primary);
        }
        .admin-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .admin-topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .admin-topbar-title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .admin-topbar-title span {
          color: var(--blue-primary);
        }
        .admin-topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .admin-user-email {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .admin-logout-btn {
          padding: 7px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-card);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .admin-logout-btn:hover {
          border-color: var(--blue-border);
          color: var(--text-primary);
        }
        .admin-content {
          padding: 32px;
          max-width: 1100px;
          margin: 0 auto;
        }
      `}</style>

      <div className="admin-shell">
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-topbar-title">SagaSoft <span>Admin</span></span>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-user-email">{session.user.email}</span>
            <button className="admin-logout-btn" onClick={() => signOut({ callbackUrl: '/' })}>
              Cerrar sesión
            </button>
          </div>
        </div>
        <div className="admin-content">{children}</div>
      </div>
    </>
  );
}
