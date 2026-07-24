'use client';
// app/portal/layout.js
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';

export default function PortalLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/portal/login';
  const [mounted, setMounted] = useState(false);

  // Evita mismatch de hidratación: el servidor nunca conoce el estado de
  // sesión, así que esperamos a estar montados en el cliente antes de
  // renderizar cualquier cosa que dependa de useSession().
  useEffect(() => {
    setMounted(true);
  }, []);

  // Los admins también tienen sesión de NextAuth (via Google), pero solo
  // los clientes del portal (role === 'client') pueden ver estas páginas.
  const isPortalClient = status === 'authenticated' && session?.user?.role === 'client';

  useEffect(() => {
    if (!mounted) return;
    if (isLoginPage) return;
    if (status === 'unauthenticated' || (status === 'authenticated' && !isPortalClient)) {
      router.replace('/portal/login');
    }
  }, [mounted, status, isPortalClient, isLoginPage, router]);

  // Mismo Navbar que la landing (mismo logo, mismos links, mismo formato) —
  // no un topbar reducido tipo admin. El propio Navbar detecta la sesión de
  // cliente vía useSession() y muestra el nombre/email cuando corresponde,
  // así que no hace falta pasarle nada acá.
  if (isLoginPage) {
    return (
      <>
        <Navbar />
        {children}
      </>
    );
  }

  if (!mounted || status === 'loading') {
    return (
      <>
        <Navbar />
        <div suppressHydrationWarning style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
          Verificando acceso...
        </div>
      </>
    );
  }

  if (!isPortalClient) {
    return null;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
