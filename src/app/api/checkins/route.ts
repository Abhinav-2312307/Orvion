import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { v4 } from '@/lib/uuid';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const sheetId = searchParams.get('sheetId');

  if (sheetId) {
    const checkins = db.prepare(`
      SELECT ci.*, u.name as manager_name
      FROM check_ins ci
      JOIN users u ON ci.manager_id = u.id
      WHERE ci.sheet_id = ?
      ORDER BY ci.created_at DESC
    `).all(sheetId);

    return NextResponse.json({ checkins });
  }

  return NextResponse.json({ checkins: [] });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role !== 'manager' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Only managers can create check-ins' }, { status: 403 });
  }

  const db = getDb();
  const { sheetId, quarter, comment } = await request.json();

  if (!comment || comment.trim().length === 0) {
    return NextResponse.json({ error: 'Check-in comment is required' }, { status: 400 });
  }

  const id = v4();
  db.prepare(`
    INSERT INTO check_ins (id, sheet_id, quarter, manager_id, comment, is_completed)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(id, sheetId, quarter, session.userId, comment);

  // Notify employee
  const sheet = db.prepare('SELECT employee_id FROM goal_sheets WHERE id = ?').get(sheetId) as { employee_id: string };
  db.prepare(`INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(v4(), sheet.employee_id, `${quarter} Check-in Complete`, `${session.name} has completed your ${quarter} check-in review`, 'success', '/employee/goals');

  return NextResponse.json({ success: true, id });
}
