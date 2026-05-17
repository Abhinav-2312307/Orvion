import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { v4 } from '@/lib/uuid';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  seedDatabase();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const cycles = db.prepare('SELECT * FROM goal_cycles ORDER BY year DESC').all();

  return NextResponse.json({ cycles });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can manage cycles' }, { status: 403 });
  }

  const db = getDb();
  const body = await request.json();
  const { action } = body;

  if (action === 'create') {
    const { name, year, goalWindowStart, goalWindowEnd, q1Start, q1End, q2Start, q2End, q3Start, q3End, q4Start, q4End } = body;
    const id = v4();

    db.prepare(`
      INSERT INTO goal_cycles (id, name, year, status, goal_window_start, goal_window_end, q1_start, q1_end, q2_start, q2_end, q3_start, q3_end, q4_start, q4_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, year, 'active', goalWindowStart, goalWindowEnd, q1Start, q1End, q2Start, q2End, q3Start, q3End, q4Start, q4End);

    return NextResponse.json({ success: true, id });
  }

  if (action === 'update_status') {
    const { cycleId, status } = body;
    db.prepare('UPDATE goal_cycles SET status = ? WHERE id = ?').run(status, cycleId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
