'use client';
// app/portal/login/page.js
// Login de clientes del portal: email+contraseña de Odoo (usuario portal).
// Mismo patrón de página que app/admin/login/page.js (login-screen/login-card),
// pero con CredentialsProvider('odoo-credentials') en vez de Google.
import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function PortalLoginForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setError('Tu sesión expiró. Ingresá de nuevo.');
    }
  }, [searchParams]);

  useEffect(() => {
    // Si ya hay sesión de cliente activa, no tiene sentido mostrar el login.
    if (status === 'authenticated' && session?.user?.role === 'client') {
      router.replace('/portal');
    }
  }, [status, session, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('odoo-credentials', { redirect: false, email, password });
      if (res?.error === 'CredentialsSignin') {
        setError('Email o contraseña incorrectos.');
      } else if (res?.error === 'ODOO_CONNECTION') {
        setError('No pudimos conectar con el sistema. Intenta más tarde.');
      } else if (res?.error) {
        setError('Error inesperado. Intenta de nuevo.');
      } else if (res?.ok) {
        router.push('/portal');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo en un momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          padding: 120px 24px 24px;
        }
        .login-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 48px;
          width: 100%;
          max-width: 420px;
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
        .portal-form { display: flex; flex-direction: column; gap: 12px; }
        .portal-input {
          padding: 14px 18px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-card);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none; transition: border-color 0.2s;
        }
        .portal-input::placeholder { color: var(--text-muted); font-size: 13px; }
        .portal-input:focus { border-color: var(--blue-primary); }
        .portal-input.error { border-color: #ef4444; }
        .portal-btn {
          padding: 14px 24px; background: var(--blue-primary); color: #000;
          border: none; border-radius: 10px;
          font-family: var(--font-display); font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .portal-btn:hover:not(:disabled) { background: var(--blue-bright); transform: translateY(-1px); }
        .portal-btn:disabled { opacity: 0.6; cursor: default; }
        .portal-error { margin-top: 16px; font-size: 13px; color: #ef4444; }
        .portal-hint { margin-top: 20px; font-size: 12px; color: var(--text-muted); }
      `}</style>

      <div className="login-screen">
        <div className="login-card">
          <div className="login-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="login-title">Acceso exclusivo</h1>
          <p className="login-sub">
            Ingresa con el email y la contraseña de tu cuenta de cliente para ver el estado de tus proyectos.
          </p>

          <form className="portal-form" onSubmit={handleLogin}>
            <input
              type="email"
              className={`portal-input ${error ? 'error' : ''}`}
              placeholder="tu@empresa.com"
              value={email}
              autoComplete="email"
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              required
            />
            <input
              type="password"
              className={`portal-input ${error ? 'error' : ''}`}
              placeholder="Contraseña"
              value={password}
              autoComplete="current-password"
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
            />
            <button type="submit" className="portal-btn" disabled={loading || !email || !password}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>

          {error && <p className="portal-error">{error}</p>}
          <p className="portal-hint">¿No tienes acceso? Contacta a tu gestor de proyecto en SagaSoft.</p>
        </div>
      </div>
    </>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={null}>
      <PortalLoginForm />
    </Suspense>
  );
}
