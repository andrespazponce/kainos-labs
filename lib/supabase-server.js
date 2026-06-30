// lib/supabase-server.js
// Cliente de Supabase para uso EXCLUSIVO en el servidor (API routes, server components).
// Usa la service_role key, que tiene permisos completos y NUNCA debe llegar al navegador.
// Por eso este archivo no tiene 'use client' y solo se importa desde código que corre en servidor.

import { createClient } from '@supabase/supabase-js';

let supabaseAdmin = null;

export function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno de Vercel.'
    );
  }

  supabaseAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  return supabaseAdmin;
}
