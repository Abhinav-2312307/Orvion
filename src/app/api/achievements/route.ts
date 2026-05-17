import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { v4 } from '@/lib/uuid';
import { computeProgressScore } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const body = await request.json();
  const { action } = body;

  if (action === 'update') {
    const { goalId, quarter, actualValue, actualDate, status } = body;

    // Verify goal ownership
    const goal = db.prepare(`
      SELECT g.*, gs.employee_id, gs.status as sheet_status
      FROM goals g
      JOIN goal_sheets gs ON g.sheet_id = gs.id
      WHERE g.id = ?
    `).get(goalId) as Record<string, unknown> | undefined;

    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    if (goal.employee_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    if (goal.sheet_status !== 'approved') {
      return NextResponse.json({ error: 'Goals must be approved before logging achievements' }, { status: 400 });
    }

    // Compute progress score
    const score = computeProgressScore(
      goal.uom_type as string,
      goal.target_value as number | null,
      goal.target_date as string | null,
      actualValue,
      actualDate
    );

    // Upsert achievement
    const existing = db.prepare(
      'SELECT id FROM achievements WHERE goal_id = ? AND quarter = ?'
    ).get(goalId, quarter) as { id: string } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE achievements SET actual_value = ?, actual_date = ?, status = ?, progress_score = ?, updated_at = datetime('now'), updated_by = ?
        WHERE id = ?
      `).run(actualValue, actualDate, status, score, session.userId, existing.id);

      // Log audit
      db.prepare(`INSERT INTO audit_logs (id, table_name, record_id, action, field_name, old_value, new_value, changed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(v4(), 'achievements', existing.id, 'update', 'actual_value', null, String(actualValue), session.userId);
    } else {
      const achId = v4();
      db.prepare(`
        INSERT INTO achievements (id, goal_id, quarter, actual_value, actual_date, status, progress_score, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(achId, goalId, quarter, actualValue, actualDate, status, score, session.userId);
    }

    // Sync shared goals - if this is a primary goal, update all linked copies
    if (!goal.is_shared || !goal.shared_from) {
      const linkedGoals = db.prepare('SELECT id FROM goals WHERE shared_from = ?').all(goalId) as { id: string }[];
      for (const linked of linkedGoals) {
        const linkedExisting = db.prepare(
          'SELECT id FROM achievements WHERE goal_id = ? AND quarter = ?'
        ).get(linked.id, quarter) as { id: string } | undefined;

        if (linkedExisting) {
          db.prepare(`
            UPDATE achievements SET actual_value = ?, actual_date = ?, status = ?, progress_score = ?, updated_at = datetime('now'), updated_by = ?
            WHERE id = ?
          `).run(actualValue, actualDate, status, score, session.userId, linkedExisting.id);
        } else {
          db.prepare(`
            INSERT INTO achievements (id, goal_id, quarter, actual_value, actual_date, status, progress_score, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(v4(), linked.id, quarter, actualValue, actualDate, status, score, session.userId);
        }
      }
    }

    return NextResponse.json({ success: true, progressScore: score });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
