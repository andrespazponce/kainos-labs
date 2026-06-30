'use client';
// components/ui/ThemeSwitcher.js
import { useState } from 'react';
import { useTheme, THEMES } from './ThemeProvider';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <>
      <style>{`
        .theme-switcher {
          position: relative;
        }
        .theme-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-card);
          border-radius: 100px;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        .theme-trigger:hover {
          border-color: var(--blue-border);
        }
        .theme-trigger-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .theme-trigger-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.02em;
        }
        .theme-trigger-arrow {
          color: var(--text-muted);
          transition: transform 0.2s ease;
          display: flex;
        }
        .theme-trigger-arrow.open {
          transform: rotate(180deg);
        }
        .theme-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: 12px;
          padding: 6px;
          min-width: 160px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          z-index: 200;
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
          transition: all 0.18s ease;
        }
        .theme-dropdown.open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .theme-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 10px;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease;
        }
        .theme-option:hover {
          background: var(--bg-elevated);
        }
        .theme-option.active {
          background: var(--blue-glow);
        }
        .theme-option-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 6px currentColor;
        }
        .theme-option-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .theme-overlay {
          position: fixed;
          inset: 0;
          z-index: 150;
        }
      `}</style>

      <div className="theme-switcher">
        <button
          className="theme-trigger"
          onClick={() => setOpen(!open)}
          aria-label="Cambiar tema visual"
        >
          <span className="theme-trigger-dot" style={{ background: current.dotColor, boxShadow: `0 0 6px ${current.dotColor}` }} />
          <span className="theme-trigger-label">{current.label}</span>
          <span className={`theme-trigger-arrow ${open ? 'open' : ''}`}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>

        {open && <div className="theme-overlay" onClick={() => setOpen(false)} />}

        <div className={`theme-dropdown ${open ? 'open' : ''}`}>
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-option ${theme === t.id ? 'active' : ''}`}
              onClick={() => { setTheme(t.id); setOpen(false); }}
            >
              <span className="theme-option-dot" style={{ background: t.dotColor, color: t.dotColor }} />
              <span className="theme-option-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
