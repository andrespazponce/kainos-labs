// app/layout.js
import './globals.css';

export const metadata = {
  title: 'KAINOS LABS — Tecnología que transforma empresas',
  description: 'Soluciones de inteligencia artificial, automatización y tecnología empresarial.',
  icons: {
    icon: '/assets/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
