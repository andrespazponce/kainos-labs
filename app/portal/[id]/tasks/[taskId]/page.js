'use client';
// app/portal/[id]/tasks/[taskId]/page.js
// Detalle de una tarea + chatter, como el portal nativo de Odoo (/my/tasks/<id>).
// El cliente lee y escribe mensajes con SU PROPIA sesión de Odoo — no hay bot:
// project.task._mail_post_access = 'read' permite postear a quien tenga lectura
// de la tarea, y Odoo atribuye el mensaje a su partner. app/portal/layout.js
// garantiza sesión de cliente.
import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'dompurify';

const STATUS_CONFIG = {
  done: { label: 'Completado', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', dot: '#22c55e' },
  'in-progress': { label: 'En progreso', color: 'var(--blue-primary)', bg: 'var(--blue-glow)', dot: 'var(--blue-primary)' },
  pending: { label: 'Pendiente', color: '#555d6e', bg: 'rgba(85,93,110,0.1)', dot: '#555d6e' },
};

// Sanitización AUTORITATIVA del HTML del chatter (bodies de otros usuarios),
// en el cliente, justo antes de dangerouslySetInnerHTML. El servidor hace un
// strip conservador adicional como defense-in-depth.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'a', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 'span', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
};

if (typeof window !== 'undefined' && !window.__portalDompurifyHook) {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
  window.__portalDompurifyHook = true;
}

function cleanHtml(html) {
  if (typeof window === 'undefined') return '';
  return DOMPurify.sanitize(html || '', SANITIZE_CONFIG);
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '?';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const iso = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PortalTaskPage({ params }) {
  const projectId = params.id;
  const taskId = params.taskId;
  const router = useRouter();

  const [task, setTask] = useState(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [taskError, setTaskError] = useState(''); // '' | 'notfound' | 'generic'

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messagesError, setMessagesError] = useState('');
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const handleAuthExpired = useCallback(async () => {
    await signOut({ redirect: false });
    router.push('/portal/login?expired=1');
  }, [router]);

  const loadTask = useCallback(async () => {
    setLoadingTask(true);
    setTaskError('');
    try {
      const res = await fetch(`/api/portal/tasks/${taskId}`);
      if (res.status === 401) { await handleAuthExpired(); return null; }
      if (res.status === 404) { setTaskError('notfound'); return null; }
      if (!res.ok) { setTaskError('generic'); return null; }
      const data = await res.json();
      setTask(data.task);
      return data.task;
    } catch {
      setTaskError('generic');
      return null;
    } finally {
      setLoadingTask(false);
    }
  }, [taskId, handleAuthExpired]);

  const loadMessages = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/portal/tasks/${taskId}/messages`);
      if (res.status === 401) { await handleAuthExpired(); return; }
      if (!res.ok) {
        if (!silent) setMessagesError('No se pudieron cargar los mensajes.');
        return;
      }
      const data = await res.json();
      setMessages(data.messages || []);
      setMessagesError('');
    } catch {
      if (!silent) setMessagesError('Error de conexión al cargar mensajes.');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [taskId, handleAuthExpired]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = await loadTask();
      if (cancelled || !t) return;
      await loadMessages();
    })();
    return () => { cancelled = true; };
  }, [loadTask, loadMessages]);

  // Polling suave del chatter solo con la pestaña visible.
  useEffect(() => {
    if (!task) return;
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') loadMessages({ silent: true });
    }, 25000);
    return () => clearInterval(iv);
  }, [task, loadMessages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const text = composer.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch(`/api/portal/tasks/${taskId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      });
      if (res.status === 401) { await handleAuthExpired(); return; }
      if (!res.ok) {
        setSendError('No se pudo enviar el mensaje. Intenta de nuevo.');
        return;
      }
      setComposer('');
      await loadMessages({ silent: true });
    } catch {
      setSendError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const handleTextareaKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const st = task ? STATUS_CONFIG[task.status] : null;
  const subtasks = task?.subtasks || [];

  return (
    <>
      <style>{`
        .portal-page { padding: 100px 0; }
        .portal-box { max-width: 760px; margin: 0 auto; }
        .portal-loading, .portal-error-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-lg);
          padding: 56px; text-align: center;
          color: var(--text-secondary); font-size: 14px;
        }
        .portal-back {
          display: inline-flex; align-items: center; gap: 6px; margin-bottom: 20px;
          font-size: 13px; color: var(--text-secondary); text-decoration: none;
          transition: color 0.2s;
        }
        .portal-back:hover { color: var(--text-primary); }
        .portal-dashboard {
          background: var(--bg-card);
          border: 1px solid var(--blue-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .task-head {
          padding: 28px 32px; border-bottom: 1px solid var(--border-subtle);
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .task-head-title { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--text-primary); }
        .task-head-project { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
        .task-status-chip { padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
        .subtasks-section { padding: 20px 32px; border-bottom: 1px solid var(--border-subtle); }
        .subtasks-title {
          font-family: var(--font-display); font-size: 12px; font-weight: 600;
          color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px;
        }
        .subtask-link {
          display: flex; align-items: center; gap: 10px; padding: 8px 0;
          text-decoration: none; transition: padding-left 0.15s;
        }
        .subtask-link:hover { padding-left: 4px; }
        .subtask-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .subtask-name { flex: 1; font-size: 13px; color: var(--text-secondary); }
        .subtask-link:hover .subtask-name { color: var(--text-primary); }

        /* ── Chatter ── */
        .chatter-section { padding: 24px 32px 32px; }
        .chatter-title {
          font-family: var(--font-display); font-size: 14px; font-weight: 600;
          color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px;
        }
        .chatter-list {
          display: flex; flex-direction: column; gap: 16px;
          margin-bottom: 20px; max-height: 460px; overflow-y: auto;
        }
        .chatter-empty { padding: 8px 0 20px; font-size: 13px; color: var(--text-muted); }
        .chatter-msg { display: flex; gap: 12px; align-items: flex-start; }
        .chatter-msg.mine { flex-direction: row-reverse; }
        .chatter-avatar {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          background: var(--bg-elevated); border: 1px solid var(--border-card);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: var(--text-secondary);
          font-family: var(--font-display);
        }
        .chatter-bubble {
          max-width: 78%;
          background: var(--bg-elevated); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm); padding: 10px 14px;
        }
        .chatter-msg.mine .chatter-bubble { background: var(--blue-glow); border-color: var(--blue-border); }
        .chatter-meta { display: flex; gap: 8px; align-items: baseline; margin-bottom: 4px; flex-wrap: wrap; }
        .chatter-author { font-size: 12px; font-weight: 700; color: var(--text-primary); }
        .chatter-date { font-size: 11px; color: var(--text-muted); }
        .chatter-body { font-size: 13px; color: var(--text-secondary); line-height: 1.5; word-break: break-word; }
        .chatter-body a { color: var(--blue-primary); }
        .chatter-body p { margin: 0 0 6px; }
        .chatter-body p:last-child { margin-bottom: 0; }
        .chatter-composer { display: flex; flex-direction: column; gap: 10px; }
        .chatter-textarea {
          width: 100%; min-height: 74px; resize: vertical;
          padding: 12px 14px; background: var(--bg-elevated);
          border: 1px solid var(--border-card); border-radius: 10px;
          color: var(--text-primary); font-size: 14px; font-family: var(--font-body);
          line-height: 1.5; outline: none; transition: border-color 0.2s;
        }
        .chatter-textarea:focus { border-color: var(--blue-primary); }
        .chatter-composer-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .chatter-hint { font-size: 11px; color: var(--text-muted); }
        .chatter-send-error { font-size: 12px; color: #ef4444; }
        .chatter-send-btn {
          padding: 10px 22px; background: var(--blue-primary); color: var(--on-accent-text);
          border: none; border-radius: 10px; font-family: var(--font-display);
          font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .chatter-send-btn:hover:not(:disabled) { background: var(--blue-bright); transform: translateY(-1px); }
        .chatter-send-btn:disabled { opacity: 0.6; cursor: default; }
        @media (max-width: 600px) {
          .task-head, .subtasks-section, .chatter-section { padding-left: 20px; padding-right: 20px; }
          .chatter-bubble { max-width: 82%; }
        }
      `}</style>

      <section className="portal-page">
        <div className="container">
          <div className="portal-box">
            <Link href={`/portal/${projectId}`} className="portal-back">
              ← {task?.projectName || 'Volver al proyecto'}
            </Link>

            {loadingTask ? (
              <div className="portal-loading">Cargando la tarea...</div>
            ) : taskError === 'notfound' ? (
              <div className="portal-error-card">Esta tarea no existe o no está compartida con tu cuenta.</div>
            ) : taskError ? (
              <div className="portal-error-card">No pudimos cargar la tarea. Intenta más tarde.</div>
            ) : (
              <div className="portal-dashboard">
                <div className="task-head">
                  <div>
                    <div className="task-head-title">{task.name}</div>
                    <div className="task-head-project">{task.projectName}</div>
                  </div>
                  {st && (
                    <span className="task-status-chip" style={{ color: st.color, background: st.bg }}>
                      {task.stageName || st.label}
                    </span>
                  )}
                </div>

                {subtasks.length > 0 && (
                  <div className="subtasks-section">
                    <div className="subtasks-title">Subtareas</div>
                    {subtasks.map((s) => {
                      const sst = STATUS_CONFIG[s.status];
                      return (
                        <Link key={s.id} href={`/portal/${projectId}/tasks/${s.id}`} className="subtask-link">
                          <span className="subtask-dot" style={{ background: sst.dot }} />
                          <span className="subtask-name">{s.title}</span>
                          <span className="task-status-chip" style={{ color: sst.color, background: sst.bg }}>{sst.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                <div className="chatter-section">
                  <div className="chatter-title">Conversación con el equipo</div>

                  {loadingMessages ? (
                    <p className="chatter-empty">Cargando mensajes...</p>
                  ) : messagesError ? (
                    <p className="chatter-empty">{messagesError}</p>
                  ) : messages.length === 0 ? (
                    <p className="chatter-empty">Todavía no hay mensajes. Escribe el primero para hablar con el equipo sobre esta tarea.</p>
                  ) : (
                    <div className="chatter-list">
                      {messages.map((m) => (
                        <div key={m.id} className={`chatter-msg ${m.isMine ? 'mine' : ''}`}>
                          <div className="chatter-avatar">{initials(m.authorName)}</div>
                          <div className="chatter-bubble">
                            <div className="chatter-meta">
                              <span className="chatter-author">{m.isMine ? 'Tú' : m.authorName}</span>
                              <span className="chatter-date">{formatDate(m.date)}</span>
                            </div>
                            <div className="chatter-body" dangerouslySetInnerHTML={{ __html: cleanHtml(m.body) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <form className="chatter-composer" onSubmit={handleSend}>
                    <textarea
                      className="chatter-textarea"
                      placeholder="Escribe un mensaje para el equipo sobre esta tarea..."
                      value={composer}
                      onChange={(e) => { setComposer(e.target.value); setSendError(''); }}
                      onKeyDown={handleTextareaKey}
                      maxLength={5000}
                      disabled={sending}
                    />
                    <div className="chatter-composer-row">
                      <span className="chatter-hint">
                        {sendError
                          ? <span className="chatter-send-error">{sendError}</span>
                          : 'Enter para enviar · Shift+Enter para nueva línea'}
                      </span>
                      <button type="submit" className="chatter-send-btn" disabled={sending || !composer.trim()}>
                        {sending ? 'Enviando...' : 'Enviar'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
