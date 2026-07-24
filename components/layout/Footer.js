// components/layout/Footer.js

export default function Footer() {
  return (
    <>
      <style>{`
        .footer {
          padding: 40px 0;
          border-top: 1px solid var(--border-subtle);
        }
        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .footer-brand {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .footer-brand span {
          color: var(--blue-primary);
        }
        .footer-copy {
          font-size: 12px;
          color: var(--text-muted);
        }
        .footer-links {
          display: flex;
          gap: 20px;
        }
        .footer-links a {
          font-size: 12px;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: var(--blue-primary);
        }
      `}</style>

      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-brand">Saga<span>Soft</span></span>
          <span className="footer-copy">© {new Date().getFullYear()} SagaSoft. Todos los derechos reservados.</span>
          <div className="footer-links">
            <a href="#productos">Productos</a>
            <a href="#servicios">Servicios</a>
            <a href="/portal">Portal</a>
          </div>
        </div>
      </footer>
    </>
  );
}
