// lib/admin-guard.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Verifica que la petición venga de una sesión de admin autenticada.
// Úsalo al inicio de CADA API route bajo /api/admin/*.
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { authorized: false, session: null };
  }
  return { authorized: true, session };
}
