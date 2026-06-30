'use client';
// app/admin/page.js
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newOdooId, setNewOdooId] = useState('');
  const [newOdooName, setNewOdooName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const loadClients = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/clients');
      if (!res.ok) throw new Error('No se pudo cargar la lista de clientes');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCreate = async () => {
    if (!newCompany.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: newCompany.trim(),
          odoo_project_id: newOdooId ? parseInt(newOdooId, 10) : null,
          odoo_project_name: newOdooName.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Error al crear cliente');
      setNewCompany('');
      setNewOdooId('');
      setNewOdooName('');
      setShowNewForm(false);
      await loadClients();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRegenerateCode = async (id) => {
    if (!confirm('¿Regenerar el código de acceso? El código anterior dejará de funcionar.')) return;
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate_code: true }),
      });
      if (!res.ok) throw new Error('Error al regenerar código');
      await loadClients();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleToggleStatus = async (client) => {
    const newStatus = client.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Error al actualizar estado');
      await loadClients();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Eliminar permanentemente a "${name}"? Esto borra también sus tareas. No se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar cliente');
      await loadClients();
    } catch (e) {
      setError(e.message);
    }
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <>
      <style>{`
        .admin-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 28px;
        }
        .admin-page-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .admin-page-sub {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .admin-new-btn {
          padding: 11px 20px;
          background: var(--blue-primary);
          color: #000;
          border: none;
          border-radius: 8px;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .admin-error-banner {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
        }
        .new-client-form {
          background: var(--bg-card);
          border: 1px solid var(--blue-border);
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        .form-input {
          padding: 11px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-card);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
        }
        .form-input:focus {
          border-color: var(--blue-primary);
        }
        .form-actions {
          display: flex;
          gap: 10px;
        }
        .form-btn-primary {
          padding: 10px 18px;
          background: var(--blue-primary);
          color: #000;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .form-btn-primary:disabled { opacity: 0.5; }
        .form-btn-ghost {
          padding: 10px 18px;
          background: transparent;
          border: 1px solid var(--border-card);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
        }
        .clients-table {
          width: 100%;
          border-collapse: collapse;
        }
        .clients-table th {
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .clients-table td {
          padding: 14px 12px;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 13px;
          color: var(--text-primary);
        }
        .client-name-cell { font-weight: 600; }
        .client-odoo-cell { color: var(--text-muted); font-size: 12px; }
        .code-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-card);
          border-radius: 6px;
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
        }
        .code-chip:hover { border-color: var(--blue-border); }
        .code-chip.copied { border-color: var(--blue-border); color: var(--blue-primary); }
        .progress-mini-track {
          width: 80px;
          height: 5px;
          background: var(--bg-elevated);
          border-radius: 100px;
          overflow: hidden;
          display: inline-block;
          vertical-align: middle;
          margin-right: 8px;
        }
        .progress-mini-fill { height: 100%; background: var(--blue-primary); }
        .status-pill { padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; }
        .status-pill.active { color: #22c55e; background: rgba(34,197,94,0.1); }
        .status-pill.paused { color: #f59e0b; background: rgba(245,158,11,0.1); }
        .row-actions { display: flex; gap: 6px; }
        .icon-btn {
          padding: 6px 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-card);
          border-radius: 6px;
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
        }
        .icon-btn:hover { border-color: var(--blue-border); color: var(--text-primary); }
        .icon-btn.danger:hover { border-color: rgba(239,68,68,0.4); color: #ef4444; }
        .empty-state { text-align: center; padding: 60px 0; color: var(--text-muted); font-size: 13px; }
        @media (max-width: 700px) {
          .form-row { grid-template-columns: 1fr; }
          .clients-table { font-size: 12px; }
        }
      `}</style>

      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">Clientes</h1>
          <p className="admin-page-sub">{clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="admin-new-btn" onClick={() => setShowNewForm(!showNewForm)}>
          + Nuevo cliente
        </button>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {showNewForm && (
        <div className="new-client-form">
          <div className="form-row">
            <input
              className="form-input"
              placeholder="Nombre de la empresa *"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
            />
            <input
              className="form-input"
              placeholder="ID del proyecto en ODOO (opcional)"
              value={newOdooId}
              onChange={(e) => setNewOdooId(e.target.value)}
              type="number"
            />
            <input
              className="form-input"
              placeholder="Nombre del proyecto en ODOO (opcional)"
              value={newOdooName}
              onChange={(e) => setNewOdooName(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button className="form-btn-primary" onClick={handleCreate} disabled={creating || !newCompany.trim()}>
              {creating ? 'Creando...' : 'Crear cliente y generar código'}
            </button>
            <button className="form-btn-ghost" onClick={() => setShowNewForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Cargando clientes...</div>
      ) : clients.length === 0 ? (
        <div className="empty-state">No hay clientes registrados todavía. Crea el primero arriba.</div>
      ) : (
        <table className="clients-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Código de acceso</th>
              <th>Avance</th>
              <th>Estado</th>
              <th>Proyecto ODOO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td className="client-name-cell">{c.company_name}</td>
                <td>
                  <span
                    className={`code-chip ${copiedId === c.id ? 'copied' : ''}`}
                    onClick={() => copyCode(c.access_code, c.id)}
                    title="Click para copiar"
                  >
                    {copiedId === c.id ? '✓ Copiado' : c.access_code}
                  </span>
                </td>
                <td>
                  <span className="progress-mini-track">
                    <span className="progress-mini-fill" style={{ width: `${c.progress}%` }} />
                  </span>
                  {c.progress}%
                </td>
                <td>
                  <span className={`status-pill ${c.status}`}>
                    {c.status === 'active' ? 'Activo' : 'Pausado'}
                  </span>
                </td>
                <td className="client-odoo-cell">
                  {c.odoo_project_name || '— sin vincular —'}
                  {c.odoo_project_id ? ` (#${c.odoo_project_id})` : ''}
                </td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => handleRegenerateCode(c.id)}>Regenerar código</button>
                    <button className="icon-btn" onClick={() => handleToggleStatus(c)}>
                      {c.status === 'active' ? 'Pausar' : 'Activar'}
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(c.id, c.company_name)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
