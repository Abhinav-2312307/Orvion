# Orvion — Goal Setting & Tracking Portal

A structured, digital goal setting and tracking portal designed for organizations that need to align employee objectives with business priorities. Orvion supports the complete lifecycle of goal management — from creation and multi-level approval to quarterly check-ins, achievement tracking, and performance reporting.

**Built for AtomQuest Hackathon 1.0**

---

## Problem Statement

Organizations relying on manual or fragmented goal-tracking methods (spreadsheets, emails, offline reviews) face critical pain points:

- **Alignment gaps** — employees lack clarity on how their work connects to organizational priorities
- **Low visibility** — managers cannot monitor team progress in real time
- **No accountability** — HR teams have to piece together data manually during appraisals
- **Audit gaps** — no trail of changes to goals post-approval

Orvion eliminates these issues by providing a unified, role-based platform that enforces structured workflows, ensures data integrity, and delivers real-time visibility across all levels.

---

## Features

### Phase 1 — Goal Creation & Approval
- Employee-facing interface to create and submit a Goal Sheet (max 8 goals per sheet)
- Each goal includes: Thrust Area, UoM type (Numeric Min/Max, Percentage, Timeline, Zero-based), Target, Weightage
- System-enforced validation: total weightage must equal 100%, minimum 10% per goal
- Manager (L1) review with inline editing and approval/return workflow
- Goals lock on approval — only admin can unlock for modifications
- Shared goals: managers can push departmental KPIs to multiple team members simultaneously

### Phase 2 — Achievement Tracking & Quarterly Check-ins
- Quarter-wise (Q1–Q4) update interface for employees to log actual values
- Auto-computed progress scores using 4 different UoM-specific formulas
- Status tracking: Not Started → On Track → Completed
- Manager check-in module with structured quarterly comments
- Planned vs. Actual comparison view with visual progress indicators

### Reporting & Governance
- Achievement Report export (CSV/XLSX)
- Completion Dashboard with real-time status across all employees
- Full Audit Trail — logs every post-lock change with before/after values, user, and timestamp
- Admin analytics dashboard with QoQ trends, department heatmap, and leaderboard

### Smart Features (Bonus)
- **Smart Goal Suggestions** — Generates SMART-criteria-aligned goal recommendations based on department and role
- **Goal Quality Analyzer** — Scores goal sheets against SMART criteria and provides actionable feedback
- **Performance Insights** — Analyzes quarterly progress to identify risk areas and coaching recommendations
- **Check-in Draft Generator** — Assists managers by generating professional quarterly feedback summaries
- **Notification System** — Automated alerts for submissions, approvals, returns, and check-in deadlines

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 + Custom CSS |
| Database | SQLite via better-sqlite3 |
| Authentication | JWT (jose library) |
| Smart Features | Gemini API (gemini-2.5-flash) |
| Icons | Lucide React |
| Charts | Recharts + Custom CSS |
| Export | XLSX generation |
| Deployment | Render (Static Site) |

---

## Architecture

```
src/
├── app/
│   ├── api/                 # REST API endpoints
│   │   ├── auth/            # Login, logout, session management
│   │   ├── goals/           # Goal CRUD + approval workflow
│   │   ├── achievements/    # Quarterly tracking & scoring
│   │   ├── checkins/        # Manager check-ins
│   │   ├── team/            # Team member queries
│   │   ├── shared-goals/    # Push departmental KPIs
│   │   ├── cycles/          # Goal cycle management
│   │   ├── audit/           # Audit trail queries
│   │   ├── reports/         # Export data endpoints
│   │   ├── ai/              # Smart features gateway
│   │   └── notifications/   # Notification system
│   ├── login/               # Authentication page
│   ├── employee/            # Employee dashboard, goals, achievements
│   ├── manager/             # Manager dashboard, approvals, check-ins, team
│   └── admin/               # Admin dashboard, cycles, users, audit, reports, analytics
├── components/              # Shared UI components
│   ├── DashboardLayout.tsx  # Global layout with sidebar, topbar, notifications
│   ├── AIPanel.tsx          # Smart features interaction panel
│   └── ParticleBackground.tsx # Background animation
├── lib/                     # Core utilities
│   ├── db.ts                # Database connection & schema
│   ├── auth.ts              # JWT session management
│   ├── seed.ts              # Demo data seeder
│   ├── utils.ts             # Helper functions & formatters
│   └── uuid.ts              # ID generation
└── middleware.ts            # Route protection & auth guards
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Employee, Manager, Admin roles with org hierarchy (manager_id FK) |
| `goal_cycles` | Configurable quarterly windows with goal submission periods |
| `goal_sheets` | Status: draft → submitted → approved/returned → locked |
| `goals` | Thrust area, UoM type, target, weightage, shared flag |
| `achievements` | Quarter-wise actual values and auto-computed progress scores |
| `check_ins` | Manager feedback per quarter per employee |
| `audit_logs` | Full change history with before/after values |
| `notifications` | System alerts for key workflow events |

---

## Progress Score Formulas

| UoM Type | Formula | Example |
|----------|---------|---------|
| Numeric Min (Higher is better) | `(Actual ÷ Target) × 100` | Sales Revenue |
| Numeric Max (Lower is better) | `(Target ÷ Actual) × 100` | Turnaround Time, Cost |
| Timeline | On time = 100%, Late = scaled down | Project Delivery |
| Zero-based | `0 incidents = 100%, else 0%` | Safety Incidents |

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Abhinav-2312307/Orvion.git
cd Orvion

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the project root:

```env
JWT_SECRET=your-jwt-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | rahul@orvion.com | demo123 |
| Manager | priya@orvion.com | demo123 |
| Admin | admin@orvion.com | admin123 |

The database auto-seeds with demo data (5 users, goal cycles, sample goals) on first launch.

---

## Deployment

Currently deployed on **Render** (free tier).

### Build Configuration
- **Build Command**: `npm install; npm run build`
- **Start Command**: `npm run start`
- **Node Version**: 22.x

---

## Team

**Abhinav Sahu** — Full-Stack Developer
- Roll Number: 2312307
- Institute: PSIT, Kanpur

---

## License

MIT
