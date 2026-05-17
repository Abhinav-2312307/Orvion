import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  seedDatabase();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role !== 'manager' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const db = getDb();

  let teamMembers;
  if (session.role === 'admin') {
    teamMembers = db.prepare(`
      SELECT u.id, u.name, u.email, u.department, u.role,
             m.name as manager_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.role != 'admin'
      ORDER BY u.name ASC
    `).all();
  } else {
    teamMembers = db.prepare(`
      SELECT u.id, u.name, u.email, u.department, u.role
      FROM users u
      WHERE u.manager_id = ?
      ORDER BY u.name ASC
    `).all(session.userId);
  }

  // Enrich with goal sheet status
  const enriched = (teamMembers as Record<string, unknown>[]).map((member) => {
    const sheet = db.prepare(`
      SELECT gs.id, gs.status, gs.submitted_at, gs.approved_at,
             COUNT(g.id) as goal_count,
             SUM(g.weightage) as total_weightage
      FROM goal_sheets gs
      LEFT JOIN goals g ON g.sheet_id = gs.id
      JOIN goal_cycles gc ON gs.cycle_id = gc.id
      WHERE gs.employee_id = ? AND gc.status = 'active'
      GROUP BY gs.id
    `).get(member.id as string) as Record<string, unknown> | undefined;

    // Get completion data per quarter
    const achievements = db.prepare(`
      SELECT a.quarter, COUNT(a.id) as entries,
             AVG(a.progress_score) as avg_score
      FROM achievements a
      JOIN goals g ON a.goal_id = g.id
      JOIN goal_sheets gs ON g.sheet_id = gs.id
      JOIN goal_cycles gc ON gs.cycle_id = gc.id
      WHERE gs.employee_id = ? AND gc.status = 'active'
      GROUP BY a.quarter
    `).all(member.id as string);

    const checkins = db.prepare(`
      SELECT ci.quarter, ci.is_completed
      FROM check_ins ci
      JOIN goal_sheets gs ON ci.sheet_id = gs.id
      JOIN goal_cycles gc ON gs.cycle_id = gc.id
      WHERE gs.employee_id = ? AND gc.status = 'active'
    `).all(member.id as string);

    return {
      ...member,
      goalSheet: sheet || null,
      achievements,
      checkins,
    };
  });

  return NextResponse.json({ team: enriched });
}
