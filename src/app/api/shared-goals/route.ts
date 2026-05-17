import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { v4 } from '@/lib/uuid';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role !== 'manager' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Only managers and admins can push shared goals' }, { status: 403 });
  }

  const db = getDb();
  const { thrustArea, title, description, uomType, targetValue, targetDate, weightage, employeeIds } = await request.json();

  if (!employeeIds || employeeIds.length === 0) {
    return NextResponse.json({ error: 'Select at least one employee' }, { status: 400 });
  }

  // Create the primary goal for the manager/creator
  const primaryGoalId = v4();

  for (const empId of employeeIds) {
    // Find or create goal sheet for the employee
    const activeCycle = db.prepare('SELECT id FROM goal_cycles WHERE status = ?').get('active') as { id: string } | undefined;
    if (!activeCycle) {
      return NextResponse.json({ error: 'No active goal cycle found' }, { status: 400 });
    }

    let sheet = db.prepare(
      'SELECT id, status FROM goal_sheets WHERE employee_id = ? AND cycle_id = ?'
    ).get(empId, activeCycle.id) as { id: string; status: string } | undefined;

    if (!sheet) {
      const sheetId = v4();
      db.prepare('INSERT INTO goal_sheets (id, employee_id, cycle_id, status) VALUES (?, ?, ?, ?)').run(sheetId, empId, activeCycle.id, 'draft');
      sheet = { id: sheetId, status: 'draft' };
    }

    // Check goal count
    const goalCount = db.prepare('SELECT COUNT(*) as count FROM goals WHERE sheet_id = ?').get(sheet.id) as { count: number };
    if (goalCount.count >= 8) continue; // Skip if already at max

    const goalId = v4();
    db.prepare(`
      INSERT INTO goals (id, sheet_id, thrust_area, title, description, uom_type, target_value, target_date, weightage, is_shared, shared_from, shared_owner_id, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).run(goalId, sheet.id, thrustArea, title, description, uomType, targetValue, targetDate, weightage, primaryGoalId, session.userId, goalCount.count);

    // Notify employee
    db.prepare(`INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(v4(), empId, 'Shared Goal Added', `${session.name} has pushed a departmental KPI to your goal sheet: "${title}"`, 'info', '/employee/goals');
  }

  return NextResponse.json({ success: true, primaryGoalId });
}
