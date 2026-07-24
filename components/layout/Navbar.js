'use client';
// components/layout/Navbar.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // El Navbar detecta la sesión de cliente por sí mismo (en vez de recibir
  // un prop `user`) para que se vea igual sin importar en qué página esté
  // montado — landing, /portal o /portal/login. Antes cada página tenía que
  // acordarse de pasarle la sesión, y la landing nunca lo hacía: por eso al
  // volver de /portal a "/" el navbar mostraba el estado deslogueado aunque
  // la sesión seguía activa.
  // `mounted` evita mismatch de hidratación (el servidor no conoce el
  // estado de sesión).
  useEffect(() => {
    setMounted(true);
  }, []);
  const clientUser = mounted && status === 'authenticated' && session?.user?.role === 'client'
    ? session.user
    : null;

  // Los anclas de sección van con "/" adelante porque este Navbar se
  // renderiza también en /portal/*: un href="#productos" ahí navegaría a
  // "/portal#productos" (sin esa sección) en vez de volver a la landing.
  // Con "/#productos", desde la landing sigue siendo scroll in-page (mismo
  // path, solo cambia el hash) y desde el portal navega a la landing y
  // hace scroll a la sección.
  // El link de portal cambia de texto según haya sesión de cliente o no
  // (mismo destino /portal siempre); el resto del menú no cambia.
  const links = [
    { key: 'productos', label: 'Productos', href: '/#productos' },
    { key: 'servicios', label: 'Servicios', href: '/#servicios' },
    { key: 'logros', label: 'Logros', href: '/#logros' },
    { key: 'portal', label: clientUser ? 'Proyectos' : 'Portal Clientes', href: '/portal' },
  ];

  return (
    <>
      <style>{`
        .navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          padding: 16px 0;
          transition: all 0.3s ease;
        }
        .navbar.scrolled {
          background: rgba(15, 16, 20, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 12px 0;
        }
        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .nav-logo-icon {
          width: 32px;
          height: 32px;
        }
        .nav-logo-text {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .nav-logo-text span {
          color: var(--blue-primary);
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
          list-style: none;
        }
        .nav-links a {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s;
          letter-spacing: 0.01em;
        }
        .nav-links a:hover {
          color: var(--text-primary);
        }
        .nav-cta {
          padding: 8px 18px;
          background: var(--blue-primary);
          color: #000 !important;
          border-radius: 8px;
          font-weight: 600 !important;
          font-size: 13px !important;
          transition: all 0.2s !important;
        }
        .nav-cta:hover {
          background: var(--blue-bright);
          color: #000 !important;
          transform: translateY(-1px);
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .nav-user-menu {
          position: relative;
        }
        .nav-user-trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: var(--text-secondary);
          padding: 6px 4px;
          white-space: nowrap;
          transition: color 0.2s;
        }
        .nav-user-trigger:hover {
          color: var(--text-primary);
        }
        .nav-user-chevron {
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .nav-user-chevron.open {
          transform: rotate(180deg);
        }
        .nav-user-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 170px;
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: 10px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 12px 32px rgba(0,0,0,0.35);
          z-index: 200;
        }
        .nav-user-dropdown-item {
          text-align: left;
          padding: 9px 10px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .nav-user-dropdown-item:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        @media (max-width: 768px) {
          .nav-user-menu { display: none; }
        }
        .nav-theme-desktop {
          display: flex;
        }
        .mobile-theme-row {
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
        }
        .hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          flex-direction: column;
          gap: 5px;
          padding: 4px;
        }
        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--text-primary);
          border-radius: 2px;
          transition: all 0.3s;
        }
        .mobile-menu {
          display: none;
          position: fixed;
          top: 60px; left: 0; right: 0;
          background: rgba(15, 16, 20, 0.97);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-subtle);
          padding: 24px;
          flex-direction: column;
          gap: 16px;
          z-index: 99;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 500;
          color: var(--text-primary);
          text-decoration: none;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .nav-theme-desktop { display: none; }
          .hamburger { display: flex; }
        }
      `}</style>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <BrandIcon className="nav-logo-icon" />
            <span className="nav-logo-text">Saga<span>Soft</span></span>
          </a>

          <ul className="nav-links">
            {links.map((l) => (
              <li key={l.key}>
                <a href={l.href} className={l.key === 'portal' ? 'nav-cta' : ''}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="nav-right">
            {clientUser && <UserMenu user={clientUser} />}
            <div className="nav-theme-desktop">
              <ThemeSwitcher />
            </div>
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {links.map((l) => (
          <a key={l.key} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
        ))}
        <div className="mobile-theme-row">
          <ThemeSwitcher />
        </div>
      </div>
    </>
  );
}

// Dropdown de usuario: mismo signOut que ya usa el dashboard de /portal
// (redirect:false + push manual a /portal/login).
function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await signOut({ redirect: false });
    router.push('/portal/login');
  };

  return (
    <div className="nav-user-menu" ref={ref}>
      <button
        className="nav-user-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>{user.name || user.email}</span>
        <svg
          className={`nav-user-chevron ${open ? 'open' : ''}`}
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="nav-user-dropdown">
          <button className="nav-user-dropdown-item" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      )}
    </div>
  );
}

function BrandIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="8" y1="8" x2="20" y2="20" stroke="var(--blue-primary)" strokeWidth="2"/>
      <line x1="8" y1="32" x2="20" y2="20" stroke="var(--blue-primary)" strokeWidth="2"/>
      <line x1="20" y1="20" x2="32" y2="8" stroke="var(--blue-dim)" strokeWidth="2"/>
      <line x1="20" y1="20" x2="32" y2="32" stroke="var(--blue-dim)" strokeWidth="2"/>
      <line x1="8" y1="8" x2="32" y2="32" stroke="var(--blue-primary)" strokeWidth="1.5" opacity="0.6"/>
      <line x1="8" y1="32" x2="32" y2="8" stroke="var(--blue-primary)" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="8" cy="8" r="2.5" fill="var(--blue-primary)"/>
      <circle cx="8" cy="32" r="2.5" fill="var(--blue-primary)"/>
      <circle cx="32" cy="8" r="2.5" fill="var(--blue-dim)"/>
      <circle cx="32" cy="32" r="2.5" fill="var(--blue-dim)"/>
      <circle cx="20" cy="20" r="3.5" fill="var(--blue-primary)"/>
    </svg>
  );
}
