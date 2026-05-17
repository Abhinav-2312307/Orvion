import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role !== 'admin' && session.role !== 'manager') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const db = getDb();

  const data = db.prepare(`
    SELECT 
      u.name as employee_name,
      u.email,
      u.department,
      gc.name as cycle_name,
      gs.status as sheet_status,
      g.thrust_area,
      g.title as goal_title,
      g.uom_type,
      g.target_value,
      g.target_date,
      g.weightage,
      g.is_shared,
      a.quarter,
      a.actual_value,
      a.actual_date,
      a.status as achievement_status,
      a.progress_score
    FROM goals g
    JOIN goal_sheets gs ON g.sheet_id = gs.id
    JOIN users u ON gs.employee_id = u.id
    JOIN goal_cycles gc ON gs.cycle_id = gc.id
    LEFT JOIN achievements a ON a.goal_id = g.id
    ORDER BY u.name, g.sort_order, a.quarter
  `).all();

  return NextResponse.json({ data });
}
