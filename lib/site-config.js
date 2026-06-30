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
      url: "#", // Reemplaza con la URL real
    },
    {
      id: "marfa",
      name: "Página Web Marfa",
      description: "Sitio web institucional con diseño moderno, optimizado para conversión y presencia digital.",
      category: "Sitio Web",
      url: "#", // Reemplaza con la URL real
    },
    {
      id: "puro-fuego",
      name: "Página Web Puro Fuego",
      description: "Plataforma digital para marca gastronómica con identidad visual fuerte y experiencia de usuario fluida.",
      category: "Sitio Web",
      url: "#", // Reemplaza con la URL real
    },
  ],

  // Portal de clientes — códigos de acceso demo
  // Formato: KL-XXXX-XXXX (12 caracteres sin guiones)
  // En producción esto se conecta a ODOO via API
  clientPortal: {
    demoCode: "KL-4829-XKMT",
    clients: [
      {
        code: "KL-4829-XKMT",
        company: "INCERPAZ",
        project: "Portal Corporativo Interno",
        progress: 75,
        status: "En progreso",
        tasks: [
          { id: 1, title: "Configuración inicial del servidor", status: "done", assignee: "Equipo KAINOS" },
          { id: 2, title: "Diseño de interfaz principal", status: "done", assignee: "Equipo KAINOS" },
          { id: 3, title: "Módulo de gestión documental", status: "done", assignee: "Equipo KAINOS" },
          { id: 4, title: "Directorio corporativo", status: "in-progress", assignee: "Equipo KAINOS" },
          { id: 5, title: "Integración con Active Directory", status: "in-progress", assignee: "Equipo KAINOS" },
          { id: 6, title: "Sistema de notificaciones", status: "pending", assignee: "Equipo KAINOS" },
          { id: 7, title: "Pruebas de usuario y QA", status: "pending", assignee: "Pendiente" },
          { id: 8, title: "Capacitación al equipo", status: "pending", assignee: "Pendiente" },
        ],
      },
      {
        code: "KL-7731-DEMO",
        company: "Demo Client",
        project: "Implementación ERP ODOO",
        progress: 40,
        status: "En progreso",
        tasks: [
          { id: 1, title: "Análisis de requerimientos", status: "done", assignee: "Equipo KAINOS" },
          { id: 2, title: "Instalación de ODOO", status: "done", assignee: "Equipo KAINOS" },
          { id: 3, title: "Configuración módulo de contabilidad", status: "in-progress", assignee: "Equipo KAINOS" },
          { id: 4, title: "Módulo de proyectos", status: "pending", assignee: "Equipo KAINOS" },
          { id: 5, title: "Migración de datos", status: "pending", assignee: "Pendiente" },
        ],
      },
    ],
  },
};
