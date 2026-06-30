// lib/site-config.js
// EDITA ESTE ARCHIVO para cambiar cualquier contenido del sitio

export const siteConfig = {
  name: "KAINOS LABS",
  tagline: "Tecnología que transforma empresas",
  description: "Soluciones de inteligencia artificial, automatización y tecnología empresarial para llevar tu organización al siguiente nivel.",

  products: [
    {
      id: "ai-chatbot",
      name: "AI Chatbot Empresarial",
      description: "Asistente inteligente entrenado con el conocimiento de tu empresa. Responde consultas, automatiza soporte y mejora la experiencia de tus clientes 24/7.",
      badge: "IA",
      icon: "chat",
      highlight: true,
    },
    {
      id: "erp-odoo",
      name: "ERP ODOO",
      description: "Implementación y configuración de ODOO adaptada a tu negocio. Gestión de proyectos, contabilidad, inventario y más en una sola plataforma.",
      badge: "ERP",
      icon: "grid",
      highlight: false,
    },
  ],

  services: [
    {
      id: "automatizaciones",
      title: "Automatizaciones",
      description: "Elimina tareas repetitivas. Conectamos tus herramientas y automatizamos flujos de trabajo completos.",
      icon: "zap",
    },
    {
      id: "ia-soluciones",
      title: "Implementación con IA",
      description: "Integramos modelos de inteligencia artificial en tus procesos existentes para decisiones más rápidas y precisas.",
      icon: "brain",
    },
    {
      id: "ia-erp",
      title: "IA en ERP ODOO",
      description: "Instalamos y configuramos módulos de inteligencia artificial dentro de tu instancia ODOO.",
      icon: "cpu",
    },
    {
      id: "portales",
      title: "Portales Web",
      description: "Creamos portales corporativos, de clientes o de empleados a la medida de tu organización.",
      icon: "globe",
    },
    {
      id: "soluciones-tech",
      title: "Soluciones Tecnológicas",
      description: "Desarrollo de software personalizado para resolver problemas específicos de tu empresa.",
      icon: "code",
    },
    {
      id: "web",
      title: "Creación Web",
      description: "Diseño y desarrollo de sitios web profesionales, rápidos y optimizados para convertir visitantes en clientes.",
      icon: "monitor",
    },
  ],

  achievements: [
    {
      id: "incerpaz",
      name: "Portal Corporativo INCERPAZ",
      description: "Portal interno empresarial con gestión documental, directorio corporativo y módulos personalizados.",
      category: "Portal Corporativo",
      url: "#", // Privado — sin link público. Reemplaza si en el futuro se habilita acceso.
    },
    {
      id: "marfa",
      name: "Página Web Marfa",
      description: "Sitio web institucional con diseño moderno, optimizado para conversión y presencia digital.",
      category: "Sitio Web",
      url: "https://marfa-website.vercel.app/",
    },
    {
      id: "puro-fuego",
      name: "Página Web Puro Fuego",
      description: "Plataforma digital para marca gastronómica con identidad visual fuerte y experiencia de usuario fluida.",
      category: "Sitio Web",
      url: "https://puro-fuego-web.vercel.app/",
    },
  ],
};
