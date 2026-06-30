'use client';
// components/sections/AchievementsSection.js

export default function AchievementsSection({ achievements }) {
  return (
    <>
      <style>{`
        .achievements-section {
          padding: 100px 0;
        }
        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 56px;
        }
        .achievement-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-card);
          overflow: hidden;
          transition: all 0.25s ease;
          text-decoration: none;
          display: block;
          position: relative;
        }
        .achievement-card:hover {
          border-color: var(--blue-border);
          transform: translateY(-4px);
        }
        .achievement-card-img {
          width: 100%;
          aspect-ratio: 16/9;
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .achievement-card-img::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--blue-glow), transparent);
        }
        .achievement-placeholder {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 700;
          color: var(--blue-border);
          letter-spacing: -0.03em;
        }
        .achievement-card-body {
          padding: 24px;
        }
        .achievement-cat {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--blue-primary);
          margin-bottom: 8px;
        }
        .achievement-name {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
          letter-spacing: -0.01em;
          line-height: 1.3;
        }
        .achievement-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .achievement-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--blue-primary);
          transition: gap 0.2s ease;
        }
        .achievement-card:hover .achievement-link {
          gap: 10px;
        }
        @media (max-width: 900px) {
          .achievements-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .achievements-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="achievements-section" id="logros">
        <div className="container">
          <p className="section-label">Casos de éxito</p>
          <h2 className="section-title">Resultados reales,<br />empresas reales</h2>
          <p className="section-sub">Proyectos que hemos construido desde cero para organizaciones que necesitaban soluciones a la medida.</p>

          <div className="achievements-grid">
            {achievements.map((a) => (
              <a
                key={a.id}
                href={a.url}
                className="achievement-card"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="achievement-card-img">
                  <span className="achievement-placeholder">{a.name.charAt(0)}</span>
                </div>
                <div className="achievement-card-body">
                  <p className="achievement-cat">{a.category}</p>
                  <h3 className="achievement-name">{a.name}</h3>
                  <p className="achievement-desc">{a.description}</p>
                  <span className="achievement-link">
                    Ver proyecto →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
