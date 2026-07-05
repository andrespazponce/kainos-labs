'use client';
// app/admin/login/page.js
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Solo los admins entran al panel; una sesión de cliente del portal
    // no debe rebotar hacia /admin.
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/admin');
    }
  }, [status, session, router]);

  return (
    <>
      <style>{`
        .login-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
        }
        .login-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 48px;
          width: 100%;
          max-width: 380px;
          text-align: center;
        }
        .login-icon {
          width: 48px;
          height: 48px;
          background: var(--blue-glow);
          border: 1px solid var(--blue-border);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--blue-primary);
          margin: 0 auto 20px;
        }
        .login-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .login-sub {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 13px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-card);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .google-btn:hover {
          border-color: var(--blue-border);
        }
        .login-foot {
          margin-top: 24px;
          font-size: 11px;
          color: var(--text-muted);
        }
      `}</style>

      <div className="login-screen">
        <div className="login-card">
          <div className="login-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="login-title">Panel Administrativo</h1>
          <p className="login-sub">Acceso restringido a personal autorizado de KAINOS LABS.</p>

          <button className="google-btn" onClick={() => signIn('google', { callbackUrl: '/admin' })}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.69-2.26 1.1-3.71 1.1-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.14A6.93 6.93 0 0 1 5.4 12c0-.74.13-1.46.36-2.14V7.02H2.18A11.93 11.93 0 0 0 1 12c0 1.93.46 3.76 1.18 5.07l3.66-2.93z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.93l3.66 2.93C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Continuar con Google
          </button>

          <p className="login-foot">Si tu correo no está autorizado, contacta al administrador del sistema.</p>
        </div>
      </div>
    </>
  );
}
