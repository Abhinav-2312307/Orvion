import getDb from './db';
import { hashSync } from 'bcryptjs';
import { v4 } from './uuid';

export function seedDatabase() {
  const db = getDb();

  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  console.log('🌱 Seeding database...');

  // Create users
  const adminId = v4();
  const managerId = v4();
  const emp1Id = v4();
  const emp2Id = v4();
  const emp3Id = v4();

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, department, manager_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const pw = hashSync('demo123', 10);
  const adminPw = hashSync('admin123', 10);

  insertUser.run(adminId, 'Admin User', 'admin@orvion.com', adminPw, 'admin', 'HR', null);
  insertUser.run(managerId, 'Priya Mehta', 'priya@orvion.com', pw, 'manager', 'Engineering', null);
  insertUser.run(emp1Id, 'Rahul Sharma', 'rahul@orvion.com', pw, 'employee', 'Engineering', managerId);
  insertUser.run(emp2Id, 'Anita Desai', 'anita@orvion.com', pw, 'employee', 'Engineering', managerId);
  insertUser.run(emp3Id, 'Vikram Singh', 'vikram@orvion.com', pw, 'employee', 'Marketing', managerId);

  // Create goal cycle
  const cycleId = v4();
  db.prepare(`
    INSERT INTO goal_cycles (id, name, year, status, goal_window_start, goal_window_end, q1_start, q1_end, q2_start, q2_end, q3_start, q3_end, q4_start, q4_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    cycleId, 'FY 2026-27', 2026, 'active',
    '2026-05-01', '2026-06-30',
    '2026-07-01', '2026-07-31',
    '2026-10-01', '2026-10-31',
    '2027-01-01', '2027-01-31',
    '2027-03-01', '2027-04-30'
  );

  // Create a goal sheet for Rahul (approved state for demo)
  const sheet1Id = v4();
  db.prepare(`
    INSERT INTO goal_sheets (id, employee_id, cycle_id, status, submitted_at, approved_at, approved_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(sheet1Id, emp1Id, cycleId, 'approved', '2026-05-10', '2026-05-12', managerId);

  // Create goals for Rahul
  const goals = [
    { id: v4(), thrust: 'Revenue Growth', title: 'Increase Q1 sales revenue', desc: 'Achieve revenue target for Q1 by expanding client base', uom: 'numeric_min', target: 500000, weightage: 25 },
    { id: v4(), thrust: 'Customer Success', title: 'Reduce customer churn rate', desc: 'Bring down monthly churn to below 2%', uom: 'percentage_max', target: 2, weightage: 20 },
    { id: v4(), thrust: 'Product Delivery', title: 'Ship v2.0 features on time', desc: 'Complete all planned v2.0 milestones by deadline', uom: 'timeline', target: null, weightage: 20 },
    { id: v4(), thrust: 'Operational Excellence', title: 'Zero production incidents', desc: 'Maintain zero critical production incidents through the quarter', uom: 'zero', target: 0, weightage: 15 },
    { id: v4(), thrust: 'Team Development', title: 'Complete team training hours', desc: 'Ensure team completes 40 hours of upskilling', uom: 'numeric_min', target: 40, weightage: 20 },
  ];

  const insertGoal = db.prepare(`
    INSERT INTO goals (id, sheet_id, thrust_area, title, description, uom_type, target_value, target_date, weightage, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  goals.forEach((g, i) => {
    insertGoal.run(g.id, sheet1Id, g.thrust, g.title, g.desc, g.uom, g.target, g.uom === 'timeline' ? '2026-09-30' : null, g.weightage, i);
  });

  // Add Q1 achievements for Rahul
  const insertAch = db.prepare(`
    INSERT INTO achievements (id, goal_id, quarter, actual_value, actual_date, status, progress_score)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertAch.run(v4(), goals[0].id, 'Q1', 420000, null, 'on_track', 84);
  insertAch.run(v4(), goals[1].id, 'Q1', 1.8, null, 'on_track', 100);
  insertAch.run(v4(), goals[2].id, 'Q1', null, '2026-07-15', 'on_track', 80);
  insertAch.run(v4(), goals[3].id, 'Q1', 0, null, 'completed', 100);
  insertAch.run(v4(), goals[4].id, 'Q1', 32, null, 'on_track', 80);

  // Create a draft goal sheet for Anita
  const sheet2Id = v4();
  db.prepare(`
    INSERT INTO goal_sheets (id, employee_id, cycle_id, status)
    VALUES (?, ?, ?, ?)
  `).run(sheet2Id, emp2Id, cycleId, 'draft');

  // Create empty sheet for Vikram (submitted)
  const sheet3Id = v4();
  db.prepare(`
    INSERT INTO goal_sheets (id, employee_id, cycle_id, status, submitted_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(sheet3Id, emp3Id, cycleId, 'submitted', '2026-05-15');

  // Add goals for Vikram
  const vikramGoals = [
    { id: v4(), thrust: 'Brand Awareness', title: 'Increase social media reach', desc: 'Grow social followers by 30%', uom: 'percentage_min', target: 30, weightage: 30 },
    { id: v4(), thrust: 'Lead Generation', title: 'Generate qualified leads', desc: 'Achieve 200 marketing qualified leads per month', uom: 'numeric_min', target: 200, weightage: 35 },
    { id: v4(), thrust: 'Content Strategy', title: 'Publish monthly blog posts', desc: 'Maintain consistent content pipeline', uom: 'numeric_min', target: 12, weightage: 35 },
  ];

  vikramGoals.forEach((g, i) => {
    insertGoal.run(g.id, sheet3Id, g.thrust, g.title, g.desc, g.uom, g.target, null, g.weightage, i);
  });

  // Add a check-in for Rahul's sheet
  db.prepare(`
    INSERT INTO check_ins (id, sheet_id, quarter, manager_id, comment, is_completed)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(v4(), sheet1Id, 'Q1', managerId, 'Good progress on revenue targets. The zero-incident achievement is impressive. Lets push on training hours in Q2.', 1);

  // Add some audit logs
  db.prepare(`
    INSERT INTO audit_logs (id, table_name, record_id, action, field_name, old_value, new_value, changed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(v4(), 'goal_sheets', sheet1Id, 'status_change', 'status', 'submitted', 'approved', managerId);

  // Add notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(v4(), emp1Id, 'Goals Approved', 'Your goal sheet has been approved by Priya Mehta', 'success', '/employee/goals');
  insertNotif.run(v4(), managerId, 'Goal Sheet Submitted', 'Vikram Singh has submitted their goal sheet for review', 'info', '/manager/approvals');

  console.log('✅ Database seeded successfully');
}
