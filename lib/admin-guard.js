// lib/admin-guard.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Verifica que la petición venga de una sesión de admin autenticada.
// Úsalo al inicio de CADA API route bajo /api/admin/*.
// El chequeo de role es obligatorio: los clientes del portal también tienen
// sesión de NextAuth (via odoo-credentials) pero NO deben pasar este guard.
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return { authorized: false, session: null };
  }
  return { authorized: true, session };
}
