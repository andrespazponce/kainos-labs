'use client';
// components/sections/ProductsSection.js

export default function ProductsSection({ products }) {
  return (
    <>
      <style>{`
        .products-section {
          padding: 100px 0;
        }
        .products-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 56px;
        }
        .product-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-card);
          padding: 40px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: default;
        }
        .product-card.highlight {
          border-color: var(--blue-border);
          background: linear-gradient(135deg, var(--bg-card) 0%, rgba(0,174,239,0.05) 100%);
        }
        .product-card:hover {
          transform: translateY(-2px);
          border-color: var(--blue-border);
        }
        .product-card-glow {
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(0,174,239,0.08), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .product-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--blue-glow);
          border: 1px solid var(--blue-border);
          border-radius: 100px;
          font-size: 10px;
          font-weight: 700;
          color: var(--blue-primary);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .product-icon-wrap {
          width: 52px;
          height: 52px;
          background: var(--blue-glow);
          border: 1px solid var(--blue-border);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: var(--blue-primary);
        }
        .product-name {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .product-desc {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.7;
        }
        .product-tag-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 28px;
        }
        .product-tag {
          padding: 5px 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 100px;
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }
        @media (max-width: 768px) {
          .products-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="products-section" id="productos">
        <div className="container">
          <p className="section-label">Productos</p>
          <h2 className="section-title">Herramientas diseñadas<br />para escalar negocios</h2>
          <p className="section-sub">Dos productos core que cubren las necesidades tecnológicas más críticas de cualquier empresa moderna.</p>

          <div className="products-grid">
            {products.map((p) => (
              <div key={p.id} className={`product-card ${p.highlight ? 'highlight' : ''}`}>
                <div className="product-card-glow" />

                <div className="product-badge">
                  {p.badge}
                </div>

                <div className="product-icon-wrap">
                  <ProductIcon type={p.icon} />
                </div>

                <h3 className="product-name">{p.name}</h3>
                <p className="product-desc">{p.description}</p>

                <div className="product-tag-row">
                  {p.id === 'ai-chatbot' && ['Entrenado con tus datos', 'Multi-canal', 'Soporte 24/7'].map(t => (
                    <span key={t} className="product-tag">{t}</span>
                  ))}
                  {p.id === 'erp-odoo' && ['Contabilidad', 'Proyectos', 'CRM', 'Inventario'].map(t => (
                    <span key={t} className="product-tag">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ProductIcon({ type }) {
  if (type === 'chat') return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <line x1="9" y1="10" x2="9" y2="10" strokeLinecap="round" strokeWidth="2.5"/>
      <line x1="12" y1="10" x2="12" y2="10" strokeLinecap="round" strokeWidth="2.5"/>
      <line x1="15" y1="10" x2="15" y2="10" strokeLinecap="round" strokeWidth="2.5"/>
    </svg>
  );
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}
