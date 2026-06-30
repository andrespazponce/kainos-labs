'use client';
// components/layout/Navbar.js
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Productos', href: '#productos' },
    { label: 'Servicios', href: '#servicios' },
    { label: 'Logros', href: '#logros' },
    { label: 'Portal Clientes', href: '#portal' },
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
          .hamburger { display: flex; }
        }
      `}</style>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <KainosIcon className="nav-logo-icon" />
            <span className="nav-logo-text">KAINOS <span>LABS</span></span>
          </a>

          <ul className="nav-links">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={l.label === 'Portal Clientes' ? 'nav-cta' : ''}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {links.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
        ))}
      </div>
    </>
  );
}

function KainosIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="8" y1="8" x2="20" y2="20" stroke="#00AEEF" strokeWidth="2"/>
      <line x1="8" y1="32" x2="20" y2="20" stroke="#00AEEF" strokeWidth="2"/>
      <line x1="20" y1="20" x2="32" y2="8" stroke="#0077aa" strokeWidth="2"/>
      <line x1="20" y1="20" x2="32" y2="32" stroke="#0077aa" strokeWidth="2"/>
      <line x1="8" y1="8" x2="32" y2="32" stroke="#00AEEF" strokeWidth="1.5" opacity="0.6"/>
      <line x1="8" y1="32" x2="32" y2="8" stroke="#00AEEF" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="8" cy="8" r="2.5" fill="#00AEEF"/>
      <circle cx="8" cy="32" r="2.5" fill="#00AEEF"/>
      <circle cx="32" cy="8" r="2.5" fill="#0077aa"/>
      <circle cx="32" cy="32" r="2.5" fill="#0077aa"/>
      <circle cx="20" cy="20" r="3.5" fill="#00AEEF"/>
    </svg>
  );
}
