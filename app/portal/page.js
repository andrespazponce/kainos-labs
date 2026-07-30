'use client';
// app/portal/page.js — v5
// Features: filtros por encargado/estado, "Mis tareas", chat por tarea, descripción expandible

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const STATUS_CFG = {
  done:          { label: 'Completado',  dot: '#22c55e',            chip: { color: '#22c55e',            bg: 'rgba(34,197,94,0.12)'  } },
  'in-progress': { label: 'En progreso', dot: 'var(--blue-primary)', chip: { color: 'var(--blue-primary)', bg: 'var(--blue-glow)'      } },
  pending:       { label: 'Pendiente',   dot: '#555d6e',            chip: { color: '#555d6e',            bg: 'rgba(85,93,110,0.1)'   } },
};

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function Avatar({ name, size = 20 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span title={name} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue},55%,35%)`, color: '#fff',
      fontSize: size * 0.38, fontWeight: 700,
      border: '1.5px solid var(--bg-card)', flexShrink: 0,
    }}>{initials}</span>
  );
}

function ComboBar({ pct, inProgressPct, height = 6 }) {
  return (
    <div style={{ position: 'relative', height, borderRadius: 100, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
      {inProgressPct > 0 && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(pct + inProgressPct, 100)}%`, background: 'var(--blue-primary)', opacity: 0.25, borderRadius: 100, transition: 'width 1s ease' }} />
      )}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'linear-gradient(90deg,var(--blue-dim),var(--blue-primary))', borderRadius: 100, transition: 'width 1s ease', boxShadow: pct > 0 ? '0 0 8px rgba(0,174,239,0.4)' : 'none' }} />
    </div>
  );
}

// Panel de chat flotante
function ChatPanel({ taskId, taskTitle, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`/api/portal/tasks/${taskId}/messages`)
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`/api/portal/tasks/${taskId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft.trim() }),
      });
      setDraft('');
      // Recargar mensajes
      const res = await fetch(`/api/portal/tasks/${taskId}/messages`);
      const d = await res.json();
      setMessages(d.messages || []);
    } catch {}
    setSending(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 24, pointerEvents: 'none' }}>
      <div style={{ width: 400, height: '70vh', background: 'var(--bg-card)', border: '1px solid var(--blue-border)', borderRadius: 16, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', pointerEvents: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chat</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{taskTitle}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading && <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', paddingTop: 20 }}>Cargando mensajes...</div>}
          {!loading && messages.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', paddingTop: 20 }}>Sin mensajes todavía.</div>}
          {messages.map(msg => {
            const author = Array.isArray(msg.author_id) ? msg.author_id[1] : msg.email_from || 'Sistema';
            const hue = author.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
            return (
              <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Avatar name={author} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: `hsl(${hue},60%,65%)` }}>{author}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtDateTime(msg.date)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--bg-elevated)', borderRadius: '4px 12px 12px 12px', padding: '8px 12px' }}
                    dangerouslySetInnerHTML={{ __html: msg.body }} />
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Escribe un mensaje... (Enter para enviar)"
            style={{ flex: 1, resize: 'none', background: 'var(--bg-elevated)', border: '1px solid var(--border-card)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', height: 64, fontFamily: 'var(--font-body)' }}
          />
          <button onClick={send} disabled={sending || !draft.trim()} style={{ padding: '0 16px', background: 'var(--blue-primary)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: sending || !draft.trim() ? 0.5 : 1 }}>
            {sending ? '...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente de tarea (reutilizable para tareas y subtareas)
function TaskItem({ task, isSub = false, onOpenChat }) {
  const [descOpen, setDescOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const st = STATUS_CFG[task.status] || STATUS_CFG.pending;
  const hasSub = !isSub && task.subtasks?.length > 0;
  const hasDesc = task.description && task.description.replace(/<[^>]*>/g, '').trim().length > 0;

  return (
    <div style={{ background: isSub ? 'transparent' : 'var(--bg-elevated)', borderRadius: isSub ? 0 : 10, overflow: 'hidden', borderBottom: isSub ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: isSub ? '9px 12px 9px 0' : '11px 12px' }}>
        <div style={{ width: isSub ? 6 : 7, height: isSub ? 6 : 7, borderRadius: '50%', background: st.dot, flexShrink: 0, marginTop: 5 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: isSub ? 12 : 13, color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.status === 'done' ? 'line-through' : 'none', lineHeight: 1.4, marginBottom: 5 }}>
            {task.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 600, color: st.chip.color, background: st.chip.bg }}>
              {st.label}
            </span>
            {task.deadline && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtDate(task.deadline)}</span>
            )}
            {/* Responsable principal */}
            {task.owner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Avatar name={task.owner} size={16} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{task.owner}</span>
              </div>
            )}
            {/* Otros asignados (excluyendo el owner si ya aparece) */}
            {task.assignees?.filter(a => a.name !== task.owner).map(a => (
              <Avatar key={a.id} name={a.name} size={16} />
            ))}
          </div>
        </div>
        {/* Acciones */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {hasDesc && (
            <button onClick={() => setDescOpen(!descOpen)} title="Ver descripción" style={{ background: 'none', border: '1px solid var(--border-card)', borderRadius: 6, padding: '3px 8px', fontSize: 10, color: descOpen ? 'var(--blue-primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
              {descOpen ? 'Ocultar' : 'Descripción'}
            </button>
          )}
          <button onClick={() => onOpenChat(task)} title="Ver chat" style={{ background: 'none', border: '1px solid var(--border-card)', borderRadius: 6, padding: '3px 8px', fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chat
          </button>
        </div>
      </div>

      {/* Descripción expandible */}
      {hasDesc && descOpen && (
        <div style={{ margin: '0 12px 10px 27px', padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, borderLeft: '2px solid var(--blue-border)' }}
          dangerouslySetInnerHTML={{ __html: task.description }} />
      )}

      {/* Subtareas */}
      {hasSub && (
        <>
          <button onClick={() => setSubOpen(!subOpen)} style={{ background: 'none', border: 'none', padding: '4px 12px 8px 27px', fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.2s' }}>
            <svg style={{ transition: 'transform 0.2s', transform: subOpen ? 'rotate(90deg)' : 'none' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            {subOpen ? 'Ocultar' : 'Ver'} {task.subtasks.length} subtarea{task.subtasks.length !== 1 ? 's' : ''}
          </button>
          {subOpen && (
            <div style={{ padding: '0 12px 10px 27px', display: 'flex', flexDirection: 'column' }}>
              {task.subtasks.map(sub => (
                <TaskItem key={sub.id} task={sub} isSub onOpenChat={onOpenChat} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Navegación
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'my-tasks'

  // Filtros
  const [filterAssignees, setFilterAssignees] = useState([]); // nombres seleccionados
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'done' | 'pending'
  const [filterOpen, setFilterOpen] = useState(false);

  // Chat
  const [chatTask, setChatTask] = useState(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    if (status === 'unauthenticated') router.replace('/#portal');
  }, [mounted, status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoading(true);
    fetch('/api/portal')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        const list = data.projects || [];
        setProjects(list);
        if (list.length > 0) setActiveProject(list[0]);
      })
      .catch(() => setError('Error de conexión.'))
      .finally(() => setLoading(false));
  }, [status]);

  const toggleAssignee = (name) => {
    setFilterAssignees(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  if (!mounted || status === 'loading') {
    return <div suppressHydrationWarning style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: 14 }}>Cargando portal...</div>;
  }
  if (status !== 'authenticated') return null;

  const ms = activeProject?.milestones || [];
  const allTasks = activeProject?.tasks || [];
  const userEmail = session.user?.email || '';
  const userName = session.user?.name || '';

  // Filtrado de tareas
  const applyFilters = (tasks) => {
    return tasks.filter(task => {
      const matchesAssignee = filterAssignees.length === 0 || filterAssignees.some(name =>
        task.owner === name || task.assignees?.some(a => a.name === name)
      );
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'done' && task.status === 'done') ||
        (filterStatus === 'pending' && task.status !== 'done');
      return matchesAssignee && matchesStatus;
    });
  };

  // "Mis tareas" — tareas donde el usuario autenticado es responsable o asignado
  const myTasks = allTasks.filter(t =>
    t.owner === userName || t.assignees?.some(a => a.name === userName) ||
    t.subtasks?.some(s => s.owner === userName || s.assignees?.some(a => a.name === userName))
  );

  const activeFilterCount = filterAssignees.length + (filterStatus !== 'all' ? 1 : 0);

  return (
    <>
      <style>{`
        .pp { min-height:100vh; background:var(--bg-primary); display:flex; flex-direction:column; }
        .pp-top { position:sticky; top:0; z-index:100; display:flex; align-items:center; justify-content:space-between; padding:14px 32px; background:rgba(15,16,20,0.92); backdrop-filter:blur(16px); border-bottom:1px solid var(--border-subtle); }
        .pp-brand { font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-primary); text-decoration:none; }
        .pp-brand span { color:var(--blue-primary); }
        .pp-top-right { display:flex; align-items:center; gap:14px; }
        .pp-user { font-size:13px; color:var(--text-secondary); }
        .pp-logout { padding:6px 14px; background:transparent; border:1px solid var(--border-card); border-radius:8px; color:var(--text-secondary); font-size:12px; font-weight:500; cursor:pointer; }
        .pp-logout:hover { border-color:var(--blue-border); color:var(--text-primary); }

        /* Tabs de navegación */
        .pp-tabs { display:flex; gap:4px; padding:16px 40px 0; border-bottom:1px solid var(--border-subtle); }
        .pp-tab { padding:10px 20px; background:none; border:none; border-bottom:2px solid transparent; font-family:var(--font-display); font-size:13px; font-weight:500; color:var(--text-secondary); cursor:pointer; transition:all 0.2s; margin-bottom:-1px; }
        .pp-tab:hover { color:var(--text-primary); }
        .pp-tab.active { color:var(--blue-primary); border-bottom-color:var(--blue-primary); }
        .pp-tab-badge { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; background:var(--blue-glow); border-radius:50%; font-size:10px; color:var(--blue-primary); margin-left:6px; }

        .pp-body { flex:1; width:100%; padding:28px 40px 80px; box-sizing:border-box; }

        /* Selector de proyecto */
        .pp-proj-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
        .pp-proj-tab { padding:7px 16px; background:var(--bg-card); border:1px solid var(--border-card); border-radius:100px; font-size:13px; font-weight:500; color:var(--text-secondary); cursor:pointer; }
        .pp-proj-tab.active { background:var(--blue-glow); border-color:var(--blue-primary); color:var(--blue-primary); font-weight:600; }

        /* Cabecera */
        .pp-proj-header { background:var(--bg-card); border:1px solid var(--border-card); border-radius:var(--radius-card); padding:22px 26px; margin-bottom:24px; }
        .pp-proj-name { font-family:var(--font-display); font-size:18px; font-weight:700; color:var(--text-primary); margin-bottom:4px; }
        .pp-proj-meta { font-size:12px; color:var(--text-muted); margin-bottom:12px; }
        .pp-proj-meta b { color:var(--blue-primary); }
        .pp-bar-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
        .pp-bar-label { font-size:12px; color:var(--text-secondary); }
        .pp-bar-pct { font-family:var(--font-display); font-size:18px; font-weight:700; color:var(--blue-primary); line-height:1; }
        .pp-bar-legend { display:flex; gap:14px; margin-top:8px; }
        .pp-bar-legend-item { display:flex; align-items:center; gap:4px; font-size:10px; color:var(--text-muted); }

        /* Barra de acciones con filtros */
        .pp-actions-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
        .pp-section-title { font-family:var(--font-display); font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-muted); }
        .pp-filter-wrap { position:relative; }
        .pp-filter-btn { display:flex; align-items:center; gap:6px; padding:7px 14px; background:var(--bg-card); border:1px solid var(--border-card); border-radius:8px; font-size:12px; color:var(--text-secondary); cursor:pointer; transition:all 0.2s; }
        .pp-filter-btn:hover, .pp-filter-btn.active { border-color:var(--blue-border); color:var(--text-primary); }
        .pp-filter-count { background:var(--blue-primary); color:#000; border-radius:100px; padding:0 6px; font-size:10px; font-weight:700; }
        .pp-filter-panel { position:absolute; right:0; top:calc(100% + 8px); background:var(--bg-card); border:1px solid var(--border-card); border-radius:12px; padding:16px; min-width:220px; z-index:50; box-shadow:0 8px 24px rgba(0,0,0,0.4); }
        .pp-filter-label { font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px; }
        .pp-filter-option { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; cursor:pointer; font-size:13px; color:var(--text-primary); transition:background 0.15s; }
        .pp-filter-option:hover { background:var(--bg-elevated); }
        .pp-filter-check { width:14px; height:14px; border:1.5px solid var(--border-card); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.15s; }
        .pp-filter-check.checked { background:var(--blue-primary); border-color:var(--blue-primary); }
        .pp-filter-divider { height:1px; background:var(--border-subtle); margin:12px 0; }
        .pp-filter-clear { font-size:11px; color:var(--text-muted); cursor:pointer; padding:4px 8px; border-radius:6px; }
        .pp-filter-clear:hover { color:var(--blue-primary); }

        /* Grid de objetivos */
        .pp-ms-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px; }
        .pp-ms-card { background:var(--bg-card); border:1px solid var(--border-card); border-radius:16px; padding:18px; display:flex; flex-direction:column; gap:10px; }
        .pp-ms-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .pp-ms-name { font-family:var(--font-display); font-size:14px; font-weight:600; color:var(--text-primary); line-height:1.35; flex:1; }
        .pp-ms-pct { font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--blue-primary); text-align:right; flex-shrink:0; }
        .pp-ms-pct-sub { font-size:10px; color:var(--text-muted); margin-top:1px; }
        .pp-task-list { border-top:1px solid var(--border-subtle); padding-top:10px; display:flex; flex-direction:column; gap:4px; }

        /* Mis tareas */
        .my-tasks-list { display:flex; flex-direction:column; gap:8px; }
        .my-task-item { background:var(--bg-card); border:1px solid var(--border-card); border-radius:12px; overflow:hidden; }
        .my-task-context { padding:4px 12px 0; font-size:10px; color:var(--text-muted); font-style:italic; }

        /* Empty */
        .pp-empty { text-align:center; padding:60px 0; color:var(--text-muted); font-size:13px; }
        .pp-error { text-align:center; padding:40px 0; color:#ef4444; font-size:13px; }

        @media (max-width:768px) {
          .pp-body { padding:20px 16px 60px; }
          .pp-top, .pp-tabs { padding-left:16px; padding-right:16px; }
          .pp-ms-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="pp">
        {/* Topbar */}
        <div className="pp-top">
          <a href="/" className="pp-brand">Saga<span>Soft</span></a>
          <div className="pp-top-right">
            <span className="pp-user">{userName || userEmail}</span>
            <button className="pp-logout" onClick={() => signOut({ callbackUrl: '/' })}>Cerrar sesión</button>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="pp-tabs">
          <button className={`pp-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Vista general
          </button>
          <button className={`pp-tab ${activeTab === 'my-tasks' ? 'active' : ''}`} onClick={() => setActiveTab('my-tasks')}>
            Mis tareas
            {myTasks.length > 0 && <span className="pp-tab-badge">{myTasks.length}</span>}
          </button>
        </div>

        <div className="pp-body">
          {loading && <div className="pp-empty">Cargando desde ODOO...</div>}
          {error   && <div className="pp-error">Error: {error}</div>}

          {!loading && !error && activeProject && (
            <>
              {/* Selector de proyecto */}
              {projects.length > 1 && (
                <div className="pp-proj-tabs">
                  {projects.map(p => (
                    <button key={p.id} className={`pp-proj-tab ${activeProject.id === p.id ? 'active' : ''}`} onClick={() => setActiveProject(p)}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Cabecera del proyecto */}
              <div className="pp-proj-header">
                <div className="pp-proj-name">{activeProject.name}</div>
                <div className="pp-proj-meta">
                  <b>{ms.length}</b> objetivo{ms.length !== 1 ? 's' : ''} · <b>{allTasks.length}</b> tareas totales
                </div>
                <div className="pp-bar-row">
                  <span className="pp-bar-label">Avance general</span>
                  <span className="pp-bar-pct">
                    {activeProject.progress}%
                    {activeProject.inProgressPct > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}> · {activeProject.inProgressPct}% en curso</span>}
                  </span>
                </div>
                <ComboBar pct={activeProject.progress} inProgressPct={activeProject.inProgressPct} height={7} />
                <div className="pp-bar-legend">
                  <div className="pp-bar-legend-item"><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue-primary)' }} />Completado</div>
                  <div className="pp-bar-legend-item"><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue-primary)', opacity: 0.3 }} />En progreso</div>
                </div>
              </div>

              {/* ── VISTA GENERAL ── */}
              {activeTab === 'overview' && (
                <>
                  <div className="pp-actions-bar">
                    <div className="pp-section-title">Objetivos del proyecto</div>

                    {/* Filtros */}
                    <div className="pp-filter-wrap">
                      <button className={`pp-filter-btn ${activeFilterCount > 0 ? 'active' : ''}`} onClick={() => setFilterOpen(!filterOpen)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                        </svg>
                        Filtrar
                        {activeFilterCount > 0 && <span className="pp-filter-count">{activeFilterCount}</span>}
                      </button>

                      {filterOpen && (
                        <div className="pp-filter-panel">
                          {/* Filtro por estado */}
                          <div className="pp-filter-label">Estado</div>
                          {[['all', 'Todas'], ['pending', 'Pendientes / En progreso'], ['done', 'Completadas']].map(([val, lbl]) => (
                            <div key={val} className="pp-filter-option" onClick={() => setFilterStatus(val)}>
                              <div className={`pp-filter-check ${filterStatus === val ? 'checked' : ''}`}>
                                {filterStatus === val && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#000" strokeWidth="2" strokeLinecap="round"/></svg>}
                              </div>
                              {lbl}
                            </div>
                          ))}

                          {activeProject.assignees?.length > 0 && (
                            <>
                              <div className="pp-filter-divider" />
                              <div className="pp-filter-label">Encargado</div>
                              {activeProject.assignees.map(a => (
                                <div key={a.name} className="pp-filter-option" onClick={() => toggleAssignee(a.name)}>
                                  <div className={`pp-filter-check ${filterAssignees.includes(a.name) ? 'checked' : ''}`}>
                                    {filterAssignees.includes(a.name) && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#000" strokeWidth="2" strokeLinecap="round"/></svg>}
                                  </div>
                                  <Avatar name={a.name} size={16} />
                                  {a.name}
                                </div>
                              ))}
                            </>
                          )}

                          {activeFilterCount > 0 && (
                            <>
                              <div className="pp-filter-divider" />
                              <div className="pp-filter-clear" onClick={() => { setFilterAssignees([]); setFilterStatus('all'); }}>
                                Limpiar filtros
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {ms.length === 0 ? (
                    <div className="pp-empty">No hay objetivos configurados.</div>
                  ) : (
                    <div className="pp-ms-grid">
                      {ms.map(milestone => {
                        const filteredTasks = applyFilters(milestone.tasks);
                        if (filteredTasks.length === 0 && activeFilterCount > 0) return null;
                        const done = filteredTasks.filter(t => t.status === 'done').length;
                        const inProg = filteredTasks.filter(t => t.status === 'in-progress').length;
                        const { pct, inProgressPct } = filteredTasks.length > 0
                          ? { pct: Math.round(done / filteredTasks.length * 100), inProgressPct: Math.round(inProg / filteredTasks.length * 100) }
                          : { pct: milestone.progress, inProgressPct: milestone.inProgressPct };

                        return (
                          <div key={milestone.id} className="pp-ms-card">
                            <div className="pp-ms-head">
                              <div className="pp-ms-name">{milestone.name}</div>
                              <div>
                                <div className="pp-ms-pct">{pct}%</div>
                                <div className="pp-ms-pct-sub">{done}/{filteredTasks.length} completadas{inProg > 0 ? ` · ${inProg} en curso` : ''}</div>
                              </div>
                            </div>
                            <ComboBar pct={pct} inProgressPct={inProgressPct} height={5} />
                            <div className="pp-task-list">
                              {filteredTasks.map(task => (
                                <TaskItem key={task.id} task={task} onOpenChat={t => setChatTask(t)} />
                              ))}
                              {filteredTasks.length === 0 && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>Sin tareas con estos filtros.</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── MIS TAREAS ── */}
              {activeTab === 'my-tasks' && (
                <>
                  <div className="pp-actions-bar">
                    <div className="pp-section-title">
                      Mis tareas {userName && `— ${userName}`}
                    </div>
                  </div>

                  {myTasks.length === 0 ? (
                    <div className="pp-empty">No tienes tareas asignadas en este proyecto.</div>
                  ) : (
                    <div className="my-tasks-list">
                      {myTasks.map(task => (
                        <div key={task.id} className="my-task-item">
                          <div className="my-task-context">
                            {task.milestone_name || 'Sin objetivo'} · {activeProject.name}
                          </div>
                          <TaskItem task={task} onOpenChat={t => setChatTask(t)} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Panel de chat flotante */}
      {chatTask && (
        <ChatPanel
          taskId={chatTask.id}
          taskTitle={chatTask.title}
          onClose={() => setChatTask(null)}
        />
      )}

      {/* Cerrar filtro al hacer click fuera */}
      {filterOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setFilterOpen(false)} />
      )}
    </>
  );
}
