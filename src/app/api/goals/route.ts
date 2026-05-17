import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { v4 } from '@/lib/uuid';

// GET - Fetch goals for current user
export async function GET(request: NextRequest) {
  seedDatabase();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get('cycleId');
  const employeeId = searchParams.get('employeeId');

  // For managers - get specific employee's goals
  const targetEmployeeId = (session.role === 'manager' || session.role === 'admin') && employeeId
    ? employeeId
    : session.userId;

  let sheets;
  if (cycleId) {
    sheets = db.prepare(`
      SELECT gs.*, u.name as employee_name, u.department, u.email as employee_email,
             ab.name as approved_by_name
      FROM goal_sheets gs
      JOIN users u ON gs.employee_id = u.id
      LEFT JOIN users ab ON gs.approved_by = ab.id
      WHERE gs.employee_id = ? AND gs.cycle_id = ?
    `).all(targetEmployeeId, cycleId);
  } else {
    sheets = db.prepare(`
      SELECT gs.*, u.name as employee_name, u.department, u.email as employee_email,
             gc.name as cycle_name, gc.year,
             ab.name as approved_by_name
      FROM goal_sheets gs
      JOIN users u ON gs.employee_id = u.id
      JOIN goal_cycles gc ON gs.cycle_id = gc.id
      LEFT JOIN users ab ON gs.approved_by = ab.id
      WHERE gs.employee_id = ?
      ORDER BY gc.year DESC
    `).all(targetEmployeeId);
  }

  // Fetch goals for each sheet
  const sheetsWithGoals = (sheets as Record<string, unknown>[]).map((sheet) => {
    const goals = db.prepare(`
      SELECT g.*, 
             so.name as shared_owner_name
      FROM goals g
      LEFT JOIN users so ON g.shared_owner_id = so.id
      WHERE g.sheet_id = ?
      ORDER BY g.sort_order ASC
    `).all(sheet.id as string);

    // Fetch achievements for each goal
    const goalsWithAchievements = (goals as Record<string, unknown>[]).map((goal) => {
      const achievements = db.prepare(
        'SELECT * FROM achievements WHERE goal_id = ? ORDER BY quarter ASC'
      ).all(goal.id as string);
      return { ...goal, achievements };
    });

    return { ...sheet, goals: goalsWithAchievements };
  });

  // Fetch active cycle
  const activeCycle = db.prepare('SELECT * FROM goal_cycles WHERE status = ?').get('active');

  return NextResponse.json({ sheets: sheetsWithGoals, activeCycle });
}

// POST - Create or update goals
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const body = await request.json();
  const { action } = body;

  if (action === 'create_sheet') {
    const { cycleId } = body;

    // Check if sheet already exists
    const existing = db.prepare(
      'SELECT id FROM goal_sheets WHERE employee_id = ? AND cycle_id = ?'
    ).get(session.userId, cycleId);

    if (existing) {
      return NextResponse.json({ error: 'Goal sheet already exists for this cycle' }, { status: 400 });
    }

    const sheetId = v4();
    db.prepare(
      'INSERT INTO goal_sheets (id, employee_id, cycle_id, status) VALUES (?, ?, ?, ?)'
    ).run(sheetId, session.userId, cycleId, 'draft');

    return NextResponse.json({ sheetId });
  }

  if (action === 'save_goals') {
    const { sheetId, goals } = body;

    // Verify ownership
    const sheet = db.prepare('SELECT * FROM goal_sheets WHERE id = ?').get(sheetId) as Record<string, unknown> | undefined;
    if (!sheet) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    if (sheet.employee_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    if (sheet.status === 'approved' || sheet.status === 'locked') {
      return NextResponse.json({ error: 'Cannot edit approved/locked goals' }, { status: 400 });
    }

    // Validate goals
    if (goals.length > 8) {
      return NextResponse.json({ error: 'Maximum 8 goals allowed per sheet' }, { status: 400 });
    }

    const totalWeightage = goals.reduce((sum: number, g: { weightage: number }) => sum + g.weightage, 0);

    for (const goal of goals) {
      if (goal.weightage < 10) {
        return NextResponse.json({ error: `Goal "${goal.title}" has weightage below 10%` }, { status: 400 });
      }
    }

    // Delete existing non-shared goals and re-insert
    db.prepare('DELETE FROM goals WHERE sheet_id = ? AND is_shared = 0').run(sheetId);

    const insertGoal = db.prepare(`
      INSERT INTO goals (id, sheet_id, thrust_area, title, description, uom_type, target_value, target_date, weightage, is_shared, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    goals.forEach((g: { id?: string; thrust_area: string; title: string; description: string; uom_type: string; target_value: number; target_date: string; weightage: number }, i: number) => {
      insertGoal.run(g.id || v4(), sheetId, g.thrust_area, g.title, g.description, g.uom_type, g.target_value, g.target_date, g.weightage, i);
    });

    // Update sheet
    db.prepare('UPDATE goal_sheets SET updated_at = datetime("now") WHERE id = ?').run(sheetId);

    return NextResponse.json({ success: true, totalWeightage });
  }

  if (action === 'submit') {
    const { sheetId } = body;

    const sheet = db.prepare('SELECT * FROM goal_sheets WHERE id = ?').get(sheetId) as Record<string, unknown> | undefined;
    if (!sheet) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    if (sheet.employee_id !== session.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    if (sheet.status !== 'draft' && sheet.status !== 'returned') {
      return NextResponse.json({ error: 'Can only submit draft or returned sheets' }, { status: 400 });
    }

    // Validate total weightage = 100
    const goals = db.prepare('SELECT weightage FROM goals WHERE sheet_id = ?').all(sheetId) as { weightage: number }[];
    const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);

    if (totalWeightage !== 100) {
      return NextResponse.json({ error: `Total weightage must be exactly 100%. Currently: ${totalWeightage}%` }, { status: 400 });
    }

    if (goals.length === 0) {
      return NextResponse.json({ error: 'Cannot submit empty goal sheet' }, { status: 400 });
    }

    db.prepare(`
      UPDATE goal_sheets SET status = 'submitted', submitted_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(sheetId);

    // Notify manager
    const employee = db.prepare('SELECT name, manager_id FROM users WHERE id = ?').get(sheet.employee_id as string) as { name: string; manager_id: string } | undefined;
    if (employee?.manager_id) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(v4(), employee.manager_id, 'Goal Sheet Submitted', `${employee.name} has submitted their goal sheet for review`, 'info', '/manager/approvals');
    }

    return NextResponse.json({ success: true });
  }

  if (action === 'approve') {
    if (session.role !== 'manager' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Only managers can approve goals' }, { status: 403 });
    }

    const { sheetId, goals: updatedGoals } = body;
    const sheet = db.prepare('SELECT * FROM goal_sheets WHERE id = ?').get(sheetId) as Record<string, unknown> | undefined;
    if (!sheet || sheet.status !== 'submitted') {
      return NextResponse.json({ error: 'Sheet not found or not in submitted state' }, { status: 400 });
    }

    // Apply inline edits if any
    if (updatedGoals && updatedGoals.length > 0) {
      const totalWeightage = updatedGoals.reduce((sum: number, g: { weightage: number }) => sum + g.weightage, 0);
      if (totalWeightage !== 100) {
        return NextResponse.json({ error: `Total weightage must be 100%. Currently: ${totalWeightage}%` }, { status: 400 });
      }

      for (const goal of updatedGoals) {
        if (goal.weightage < 10) {
          return NextResponse.json({ error: `Goal weightage must be at least 10%` }, { status: 400 });
        }

        // Log audit for any changes
        const existingGoal = db.prepare('SELECT * FROM goals WHERE id = ?').get(goal.id) as Record<string, unknown> | undefined;
        if (existingGoal) {
          if (existingGoal.target_value !== goal.target_value) {
            db.prepare(`INSERT INTO audit_logs (id, table_name, record_id, action, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
              .run(v4(), 'goals', goal.id, 'update', 'target_value', String(existingGoal.target_value), String(goal.target_value), session.userId);
          }
          if (existingGoal.weightage !== goal.weightage) {
            db.prepare(`INSERT INTO audit_logs (id, table_name, record_id, action, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
              .run(v4(), 'goals', goal.id, 'update', 'weightage', String(existingGoal.weightage), String(goal.weightage), session.userId);
          }
        }

        db.prepare('UPDATE goals SET target_value = ?, weightage = ? WHERE id = ?')
          .run(goal.target_value, goal.weightage, goal.id);
      }
    }

    db.prepare(`
      UPDATE goal_sheets SET status = 'approved', approved_at = datetime('now'), approved_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(session.userId, sheetId);

    // Log audit
    db.prepare(`INSERT INTO audit_logs (id, table_name, record_id, action, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(v4(), 'goal_sheets', sheetId, 'status_change', 'status', 'submitted', 'approved', session.userId);

    // Notify employee
    const employeeId = sheet.employee_id as string;
    db.prepare(`INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(v4(), employeeId, 'Goals Approved', `Your goal sheet has been approved by ${session.name}`, 'success', '/employee/goals');

    return NextResponse.json({ success: true });
  }

  if (action === 'return') {
    if (session.role !== 'manager' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Only managers can return goals' }, { status: 403 });
    }

    const { sheetId, comment } = body;
    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Return comment is required' }, { status: 400 });
    }

    db.prepare(`
      UPDATE goal_sheets SET status = 'returned', return_comment = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(comment, sheetId);

    // Log audit
    db.prepare(`INSERT INTO audit_logs (id, table_name, record_id, action, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(v4(), 'goal_sheets', sheetId, 'status_change', 'status', 'submitted', 'returned', session.userId);

    // Notify employee
    const sheet = db.prepare('SELECT employee_id FROM goal_sheets WHERE id = ?').get(sheetId) as { employee_id: string };
    db.prepare(`INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(v4(), sheet.employee_id, 'Goals Returned', `Your goal sheet has been returned by ${session.name}. Comment: ${comment}`, 'warning', '/employee/goals');

    return NextResponse.json({ success: true });
  }

  if (action === 'unlock') {
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can unlock goals' }, { status: 403 });
    }

    const { sheetId } = body;
    db.prepare("UPDATE goal_sheets SET status = 'draft', updated_at = datetime('now') WHERE id = ?").run(sheetId);

    db.prepare(`INSERT INTO audit_logs (id, table_name, record_id, action, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(v4(), 'goal_sheets', sheetId, 'unlock', 'status', 'approved', 'draft', session.userId);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
