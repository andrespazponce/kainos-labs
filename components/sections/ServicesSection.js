'use client';
// components/sections/ServicesSection.js

const SERVICE_ICONS = {
  zap: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  brain: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9.5 2a2.5 2.5 0 0 1 5 0v.5A1.5 1.5 0 0 0 16 4h.5a2.5 2.5 0 0 1 0 5H16a1.5 1.5 0 0 0-1.5 1.5v.5a2.5 2.5 0 0 1-5 0v-.5A1.5 1.5 0 0 0 8 9.5H7.5a2.5 2.5 0 0 1 0-5H8A1.5 1.5 0 0 0 9.5 3V2z"/>
      <path d="M12 12v9M9 18l3 3 3-3"/>
    </svg>
  ),
  cpu: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  globe: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  code: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  monitor: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
};

export default function ServicesSection({ services }) {
  return (
    <>
      {/* dangerouslySetInnerHTML evita que React escape las comillas de content: ''
          en el HTML del servidor, lo que causaba un error de hidratación */}
      <style dangerouslySetInnerHTML={{ __html: `
        .services-section {
          padding: 100px 0;
          background: linear-gradient(180deg, transparent 0%, var(--blue-glow) 50%, transparent 100%);
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 56px;
        }
        .service-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-card);
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease;
          group: true;
        }
        .service-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--blue-primary), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .service-card:hover {
          border-color: var(--blue-border);
          transform: translateY(-3px);
        }
        .service-card:hover::before {
          opacity: 1;
        }
        .service-icon {
          width: 44px;
          height: 44px;
          background: var(--blue-glow);
          border: 1px solid var(--blue-border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--blue-primary);
          margin-bottom: 20px;
          transition: all 0.2s ease;
        }
        .service-card:hover .service-icon {
          background: var(--blue-border);
          border-color: var(--blue-border);
        }
        .service-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }
        .service-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.65;
        }
        @media (max-width: 900px) {
          .services-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .services-grid { grid-template-columns: 1fr; }
        }
      ` }} />

      <section className="services-section" id="servicios">
        <div className="container">
          <p className="section-label">Servicios</p>
          <h2 className="section-title">Todo lo que necesita<br />tu empresa para crecer</h2>
          <p className="section-sub">Desde automatizaciones simples hasta implementaciones complejas de IA — cubrimos todo el espectro tecnológico empresarial.</p>

          <div className="services-grid">
            {services.map((s) => (
              <div key={s.id} className="service-card">
                <div className="service-icon">
                  {SERVICE_ICONS[s.icon]}
                </div>
                <h3 className="service-title">{s.title}</h3>
                <p className="service-desc">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
