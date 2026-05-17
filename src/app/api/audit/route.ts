import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can view audit logs' }, { status: 403 });
  }

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const logs = db.prepare(`
    SELECT al.*, u.name as changed_by_name, u.email as changed_by_email
    FROM audit_logs al
    JOIN users u ON al.changed_by = u.id
    ORDER BY al.changed_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number };

  return NextResponse.json({ logs, total: total.count });
}
