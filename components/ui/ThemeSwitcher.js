'use client';
// components/ui/ThemeSwitcher.js
import { useTheme, THEMES } from './ThemeProvider';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const currentIndex = THEMES.findIndex((t) => t.id === theme);
  const current = THEMES[currentIndex] || THEMES[0];

  const handleClick = () => {
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex].id);
  };

  return (
    <>
      <style>{`
        .theme-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-card);
          border-radius: 50%;
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.15s ease;
          padding: 0;
        }
        .theme-toggle-btn:hover {
          border-color: var(--blue-border);
          transform: scale(1.06);
        }
        .theme-toggle-btn:active {
          transform: scale(0.96);
        }
        .theme-toggle-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
      `}</style>

      <button
        className="theme-toggle-btn"
        onClick={handleClick}
        aria-label="Cambiar estilo visual"
        title="Cambiar estilo visual"
      >
        <span
          className="theme-toggle-dot"
          style={{
            background: current.dotColor,
            boxShadow: `0 0 8px ${current.dotColor}`,
          }}
        />
      </button>
    </>
  );
}
