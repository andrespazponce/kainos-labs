'use client';
// components/sections/HeroSection.js
import { useEffect, useState } from 'react';

export default function HeroSection({ config }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <>
      <style>{`
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
          padding: 120px 0 80px;
        }
        .hero-grid-bg {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(var(--blue-glow) 1px, transparent 1px),
            linear-gradient(90deg, var(--blue-glow) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
        }
        .hero-glow {
          position: absolute;
          top: 20%;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, var(--blue-glow) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .hero-content {
          opacity: ${visible ? 1 : 0};
          transform: ${visible ? 'translateY(0)' : 'translateY(24px)'};
          transition: all 0.7s ease;
        }
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--blue-primary);
          margin-bottom: 24px;
        }
        .hero-eyebrow-dot {
          width: 6px;
          height: 6px;
          background: var(--blue-primary);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--blue-primary);
          animation: pulse-blue 2s infinite;
        }
        .hero-title {
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin-bottom: 24px;
          color: var(--text-primary);
        }
        .hero-title .accent {
          color: var(--blue-primary);
          display: block;
        }
        .hero-sub {
          font-size: 17px;
          color: var(--text-secondary);
          line-height: 1.75;
          margin-bottom: 40px;
          max-width: 440px;
        }
        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hero-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: ${visible ? 1 : 0};
          transition: opacity 0.8s ease 0.3s;
        }
        .hero-k-container {
          position: relative;
          width: 320px;
          height: 320px;
          animation: float 5s ease-in-out infinite;
        }
        .hero-k-ring {
          position: absolute;
          inset: -24px;
          border: 1px solid var(--blue-border);
          border-radius: 50%;
          animation: spin-slow 30s linear infinite;
        }
        .hero-k-ring-2 {
          position: absolute;
          inset: -48px;
          border: 1px solid var(--blue-glow);
          border-radius: 50%;
          animation: spin-slow 50s linear infinite reverse;
        }
        .hero-stats {
          display: flex;
          gap: 32px;
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid var(--border-subtle);
        }
        .hero-stat-num {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: var(--blue-primary);
          line-height: 1;
        }
        .hero-stat-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
          letter-spacing: 0.05em;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr; gap: 40px; }
          .hero-visual { display: none; }
          .hero-k-container { width: 200px; height: 200px; }
        }
      `}</style>

      <section className="hero" id="inicio">
        <div className="hero-grid-bg" />
        <div className="hero-glow" />

        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              Soluciones tecnológicas empresariales
            </div>

            <h1 className="hero-title">
              Tecnología que
              <span className="accent">transforma</span>
            </h1>

            <p className="hero-sub">
              {config.description}
            </p>

            <div className="hero-actions">
              <a href="#servicios" className="btn-primary">Ver servicios</a>
              <a href="/portal" className="btn-ghost">Portal clientes →</a>
            </div>

            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">3+</div>
                <div className="hero-stat-label">Proyectos entregados</div>
              </div>
              <div>
                <div className="hero-stat-num">AI</div>
                <div className="hero-stat-label">Integración inteligente</div>
              </div>
              <div>
                <div className="hero-stat-num">24/7</div>
                <div className="hero-stat-label">Soluciones activas</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-k-container">
              <div className="hero-k-ring" />
              <div className="hero-k-ring-2" />
              <LargeKIcon />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function LargeKIcon() {
  const nodes = [
    { id: 'tl', cx: 60, cy: 60 },
    { id: 'tr-top', cx: 260, cy: 60 },
    { id: 'tr-mid', cx: 260, cy: 160 },
    { id: 'tr-bot', cx: 260, cy: 260 },
    { id: 'bl', cx: 60, cy: 260 },
    { id: 'center', cx: 160, cy: 160 },
    { id: 'mid-top', cx: 160, cy: 60 },
    { id: 'mid-bot', cx: 160, cy: 260 },
  ];

  const lines = [
    ['tl', 'bl'], ['tl', 'center'], ['bl', 'center'],
    ['center', 'tr-top'], ['center', 'tr-bot'],
    ['tl', 'tr-mid'], ['bl', 'tr-mid'],
    ['center', 'mid-top'], ['center', 'mid-bot'],
  ];

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <svg viewBox="0 0 320 320" width="320" height="320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--blue-primary)" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="var(--blue-dim)" stopOpacity="0.6"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={nodeMap[a].cx} y1={nodeMap[a].cy}
          x2={nodeMap[b].cx} y2={nodeMap[b].cy}
          stroke="url(#lineGrad)"
          strokeWidth="1.5"
          opacity="0.7"
        />
      ))}

      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.cx} cy={n.cy} r="12" fill="var(--blue-glow)" filter="url(#glow)"/>
          <circle
            cx={n.cx} cy={n.cy}
            r={n.id === 'center' ? 7 : 5}
            fill={n.id === 'center' ? 'var(--blue-primary)' : 'var(--blue-dim)'}
            filter="url(#glow)"
          />
          <circle cx={n.cx} cy={n.cy} r="2" fill="var(--blue-bright)"/>
        </g>
      ))}
    </svg>
  );
}
