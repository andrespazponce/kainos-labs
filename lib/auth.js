// lib/auth.js
import GoogleProvider from 'next-auth/providers/google';

// Lista de correos autorizados a entrar al panel de administración.
// Se define en la variable de entorno ADMIN_EMAILS de Vercel, separados por coma.
// Ejemplo: ADMIN_EMAILS=tu@gmail.com,antonio@gmail.com
function getAllowedEmails() {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowed = getAllowedEmails();
      if (!user?.email) return false;
      // Si la lista está vacía por error de configuración, bloqueamos todo por seguridad.
      if (allowed.length === 0) return false;
      return allowed.includes(user.email.toLowerCase());
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
