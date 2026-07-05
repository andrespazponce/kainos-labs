// lib/auth.js
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { odooAuthenticate, odooCallKw } from '@/lib/odoo';

// Lista de correos autorizados a entrar al panel de administración.
// Se define en la variable de entorno ADMIN_EMAILS de Vercel, separados por coma.
// Ejemplo: ADMIN_EMAILS=tu@gmail.com,antonio@gmail.com
function getAllowedEmails() {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export const authOptions = {
  // CredentialsProvider solo funciona con estrategia JWT (sin adapter ya es
  // el default, pero lo dejamos explícito).
  session: { strategy: 'jwt' },
  providers: [
    // Login de administradores (panel /admin), restringido a ADMIN_EMAILS.
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Login de clientes del portal: valida email+contraseña contra Odoo.
    // La contraseña NUNCA se persiste; solo se guarda la session_id de Odoo
    // dentro del JWT de NextAuth (que viaja encriptado como JWE).
    CredentialsProvider({
      id: 'odoo-credentials',
      name: 'Portal de Clientes',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        let auth;
        try {
          auth = await odooAuthenticate(email, password);
        } catch {
          // Con redirect:false, este string llega al cliente en res.error.
          throw new Error('ODOO_CONNECTION');
        }
        if (!auth) return null; // credenciales inválidas → CredentialsSignin

        // Nombre de empresa: best-effort con la propia sesión del usuario.
        // Si los permisos de portal no dejan leer el partner, caemos al
        // nombre del usuario.
        let company = auth.name;
        try {
          let pid = Array.isArray(auth.partnerId) ? auth.partnerId[0] : auth.partnerId;
          if (!pid) {
            const [user] = await odooCallKw(auth.sessionId, 'res.users', 'read', [
              [auth.uid],
              ['partner_id'],
            ]);
            pid = user?.partner_id?.[0];
          }
          if (pid) {
            const [partner] = await odooCallKw(auth.sessionId, 'res.partner', 'read', [
              [pid],
              ['name', 'commercial_company_name'],
            ]);
            company = partner?.commercial_company_name || partner?.name || company;
          }
        } catch {
          // fallback silencioso a auth.name
        }

        return {
          id: `odoo:${auth.uid}`,
          name: auth.name,
          email,
          role: 'client',
          odooUid: auth.uid,
          odooSessionId: auth.sessionId,
          company,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Los clientes del portal ya fueron validados contra Odoo en authorize().
      if (account?.provider === 'odoo-credentials') return true;
      // Google: solo administradores.
      const allowed = getAllowedEmails();
      if (!user?.email) return false;
      // Si la lista está vacía por error de configuración, bloqueamos todo por seguridad.
      if (allowed.length === 0) return false;
      return allowed.includes(user.email.toLowerCase());
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        // Solo en el login inicial.
        if (account.provider === 'odoo-credentials') {
          token.role = 'client';
          token.odooSessionId = user.odooSessionId;
          token.odooUid = user.odooUid;
          token.company = user.company;
        } else if (account.provider === 'google') {
          token.role = 'admin';
        }
      }
      // Backfill: sesiones de admins emitidas antes de que existiera `role`.
      if (!token.role && token.email && getAllowedEmails().includes(token.email.toLowerCase())) {
        token.role = 'admin';
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role || null;
      if (token.company) session.user.company = token.company;
      // IMPORTANTE: NO copiar odooSessionId a session — la session se expone
      // al navegador vía /api/auth/session. La session_id queda solo en el JWT.
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
