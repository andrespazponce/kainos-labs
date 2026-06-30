// app/api/admin/clients/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/admin-guard';
import crypto from 'crypto';

// Genera un código tipo KL-XXXX-XXXX usando caracteres alfanuméricos
// no ambiguos (sin 0/O ni 1/I para evitar errores al transcribir a mano).
function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomPart = (len) => {
    const bytes = crypto.randomBytes(len);
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
  };
  return `KL-${randomPart(4)}-${randomPart(4)}`;
}

export async function GET() {
  const { authorized } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('clients')
    .select('id, company_name, access_code, odoo_project_id, odoo_project_name, status, created_at, tasks(id, status)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const clients = data.map((c) => {
    const total = c.tasks?.length || 0;
    const done = c.tasks?.filter((t) => t.status === 'done').length || 0;
    return {
      id: c.id,
      company_name: c.company_name,
      access_code: c.access_code,
      odoo_project_id: c.odoo_project_id,
      odoo_project_name: c.odoo_project_name,
      status: c.status,
      created_at: c.created_at,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
      task_count: total,
    };
  });

  return NextResponse.json({ clients });
}

export async function POST(request) {
  const { authorized } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { company_name, odoo_project_id, odoo_project_name } = body;

  if (!company_name) {
    return NextResponse.json({ error: 'company_name es requerido' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const access_code = generateAccessCode();

  const { data, error } = await supabase
    .from('clients')
    .insert({ company_name, access_code, odoo_project_id, odoo_project_name, status: 'active' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ client: data });
}
