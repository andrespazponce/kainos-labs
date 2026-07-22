// app/layout.js
import './globals.css';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import AuthProvider from '@/components/ui/AuthProvider';

export const metadata = {
  title: 'SagaSoft — Tecnología que transforma empresas',
  description: 'Soluciones de inteligencia artificial, automatización y tecnología empresarial.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
