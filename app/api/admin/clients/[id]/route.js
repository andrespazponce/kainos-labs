// app/api/admin/clients/[id]/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/admin-guard';
import crypto from 'crypto';

function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomPart = (len) => {
    const bytes = crypto.randomBytes(len);
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
  };
  return `KL-${randomPart(4)}-${randomPart(4)}`;
}

export async function PATCH(request, { params }) {
  const { authorized } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  const updates = {};
  if (body.company_name !== undefined) updates.company_name = body.company_name;
  if (body.status !== undefined) updates.status = body.status;
  if (body.odoo_project_id !== undefined) updates.odoo_project_id = body.odoo_project_id;
  if (body.odoo_project_name !== undefined) updates.odoo_project_name = body.odoo_project_name;
  if (body.regenerate_code === true) updates.access_code = generateAccessCode();

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ client: data });
}

export async function DELETE(request, { params }) {
  const { authorized } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('clients').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
