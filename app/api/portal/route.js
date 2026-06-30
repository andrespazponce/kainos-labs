// app/api/portal/route.js
// Endpoint público (sin login) que el portal de clientes llama para validar
// su código de acceso y obtener el estado de su proyecto.
// Solo expone los datos del cliente específico que coincide con el código —
// nunca expone la lista completa de clientes ni datos de otros.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const normalizedCode = code.trim().toUpperCase();

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name, odoo_project_name, status')
      .eq('access_code', normalizedCode)
      .eq('status', 'active')
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 404 });
    }

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status, position, subtasks(id, title, status, position)')
      .eq('client_id', client.id)
      .order('position', { ascending: true });

    if (tasksError) {
      return NextResponse.json({ error: 'Error al cargar tareas' }, { status: 500 });
    }

    const sortedTasks = (tasks || []).map((t) => ({
      ...t,
      subtasks: (t.subtasks || []).sort((a, b) => a.position - b.position),
    }));

    const totalTasks = sortedTasks.length;
    const doneTasks = sortedTasks.filter((t) => t.status === 'done').length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      company: client.company_name,
      project: client.odoo_project_name,
      progress,
      tasks: sortedTasks,
    });
  } catch (err) {
    console.error('Portal API error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
