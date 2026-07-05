// lib/odoo.js
// Cliente de Odoo para uso EXCLUSIVO en el servidor (API routes, authorize de NextAuth).
// Habla con Odoo vía JSON-RPC usando la sesión del propio usuario portal,
// de modo que Odoo aplica sus reglas de acceso (ir.rules) y cada cliente
// solo puede ver los proyectos/tareas que tiene compartidos.

// Red caída, timeout o respuesta no-2xx de Odoo.
export class OdooConnectionError extends Error {
  constructor(message = 'No se pudo conectar con Odoo') {
    super(message);
    this.name = 'OdooConnectionError';
  }
}

// La session_id de Odoo expiró o fue invalidada (error code 100).
export class OdooSessionExpiredError extends Error {
  constructor(message = 'Sesión de Odoo expirada') {
    super(message);
    this.name = 'OdooSessionExpiredError';
  }
}

// Cualquier otro error JSON-RPC devuelto por Odoo.
export class OdooRpcError extends Error {
  constructor(message = 'Error de Odoo') {
    super(message);
    this.name = 'OdooRpcError';
  }
}

function getOdooConfig() {
  const url = process.env.ODOO_URL;
  const db = process.env.ODOO_DB;
  if (!url || !db) {
    throw new Error('Faltan ODOO_URL u ODOO_DB en las variables de entorno.');
  }
  return { url: url.replace(/\/+$/, ''), db };
}

async function postJsonRpc(endpoint, params, sessionId = null) {
  const { url } = getOdooConfig();
  const headers = { 'Content-Type': 'application/json' };
  if (sessionId) headers['Cookie'] = `session_id=${sessionId}`;

  let response;
  try {
    response = await fetch(`${url}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', method: 'call', id: Date.now(), params }),
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    });
  } catch (err) {
    throw new OdooConnectionError(err?.message);
  }

  if (!response.ok) {
    throw new OdooConnectionError(`Odoo respondió HTTP ${response.status}`);
  }

  return response;
}

// Autentica contra Odoo con las credenciales reales del usuario portal.
// Devuelve { sessionId, uid, name, username, partnerId } o null si las
// credenciales son inválidas. Lanza OdooConnectionError si Odoo no responde.
export async function odooAuthenticate(login, password) {
  const { db } = getOdooConfig();
  const response = await postJsonRpc('/web/session/authenticate', { db, login, password });

  const json = await response.json();

  if (json.error) {
    // Credenciales inválidas: Odoo responde AccessDenied dentro del body.
    return null;
  }

  const result = json.result;
  if (!result || !result.uid) return null;

  const setCookie = response.headers.get('set-cookie') || '';
  const match = setCookie.match(/session_id=([^;]+)/);
  if (!match) return null;

  return {
    sessionId: match[1],
    uid: result.uid,
    name: result.name,
    username: result.username,
    partnerId: result.partner_id || null,
  };
}

// Ejecuta un método ORM en Odoo como el usuario dueño de la sesión.
export async function odooCallKw(sessionId, model, method, args = [], kwargs = {}) {
  const response = await postJsonRpc(
    '/web/dataset/call_kw',
    { model, method, args, kwargs },
    sessionId
  );

  const json = await response.json();

  if (json.error) {
    const errName = json.error.data?.name || '';
    if (json.error.code === 100 || errName.includes('SessionExpired')) {
      throw new OdooSessionExpiredError();
    }
    throw new OdooRpcError(json.error.data?.message || json.error.message);
  }

  return json.result;
}
