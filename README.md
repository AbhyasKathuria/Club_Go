# ClubGo • University Event Registration & Attendance Management Platform

A production-ready, full-stack event registration and real-time attendance management platform built for university clubs anticipating 1000+ concurrent students. Designed with strict zero-data-loss guarantees, idempotent QR check-ins, real-time live WebSocket synchronization, mobile-first volunteer scanning with offline queueing, and complete Excel reporting.

---

## Tech Stack

- **Frontend**: React 18 + Vite (TypeScript), Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend**: Node.js + Express (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Real-Time Layer**: Socket.io (Dual WebSockets + HTTP long-polling fallback for strict network firewalls)
- **QR Engine**: `qrcode` (backend generation of high-res passes & secure cryptographic tokens)
- **QR Scanner**: `html5-qrcode` (mobile-first browser camera scanner + manual token entry fallback)
- **Reporting & Export**: `exceljs` (multi-sheet `.xlsx` report generator)
- **Email Delivery**: `nodemailer` (real HTML passes with embedded CID QR attachments)
- **Hosting Targets**:
  - **Frontend**: Vercel (static SPA)
  - **Backend**: Railway, Render, Fly.io, or VPS (persistent WebSocket server)
  - **Database**: Managed PostgreSQL (Supabase, Neon, Railway) with automated daily backups

---

## The Three Portals

### 1. 🎓 Public Registration Site (Students)
- Available only when the event is in **`LAUNCHED`** status.
- **Dynamic School Themes**: Selecting a school immediately styles the form and pass card:
  - **SOC** (School of Commerce) — Yellow (`#F59E0B`)
  - **SOIS** (School of Information Science) — Light Blue (`#38BDF8`)
  - **SOD** (School of Design) — Red (`#EF4444`)
  - **SOCSE** (School of Computer Science & Engineering) — Blue (`#2563EB`)
- **Configurable Team Sizes**: Dynamic team size validation (`min_team_size` to `max_team_size`).
- **Domain Guard**: Optional institutional email restriction (e.g. `@university.edu`).
- **Pass Generation**:
  - 1 **Team Express QR Pass** (single-scan admission for the whole team).
  - Individual **Member QR Passes** for each participant.
  - Printable / Downloadable PNG cards.
  - Automated confirmation email dispatch with inline QR attachments.

### 2. 📱 Volunteer Scanning Interface (Mobile Web App)
- Scoped authentication for gate volunteers (`volunteer@clubgo.edu`).
- Mobile-optimized camera viewport using `html5-qrcode`.
- **Dual Scan Modes**:
  - **Team Scan**: Checks in the entire team at once and renders the team roster.
  - **Individual Scan**: Checks in a specific student with an exact timestamp.
- **Strict Idempotency**:
  - Scanning the same pass twice returns `DUPLICATE` without corrupting state or inflating metrics.
- **Audio Feedback**: Web Audio API synthesized tones (Success high chime, Duplicate double warning beep, Invalid buzzer).
- **Offline & Congestion Resilience**:
  - Scans are queued in browser `localStorage` if connection drops or network is congested.
  - "Sync Now" button flushes queued scans to `/api/attendance/sync-offline` upon reconnect.

### 3. 🛡️ Super Admin & Faculty Command Center
- Role-based login (`superadmin`, `faculty`).
- **Live Tabular Dashboard**:
  - Auto-updates in real time via Socket.io without browser reloads.
  - Filter by School, Attendance Status (All, Checked In, Pending), and search by name/email/token.
  - KPI summary cards (Total Teams, Total Students, Checked In, % Turnout).
  - School turnout progress bars.
- **Event Configuration**:
  - Launch/Close registration toggle.
  - Min/Max team size settings.
  - Sponsor name & persistent sponsor logo upload.
- **School Theme Customizer**:
  - Change school names and hex color codes dynamically in the database without code changes.
- **Zero-Data-Loss Architecture**:
  - **No hard delete buttons exist in the UI**.
  - Soft-delete only (`is_deleted = true`, `deleted_at`), restricted strictly to Superadmin with explicit confirmation.
  - One-click **"Export to Excel"** generating a multi-tab `.xlsx` report.
  - One-click **"Backup Snapshot"** generating a cold JSON database dump.
  - Automated background `node-cron` backups running every 6 hours.

---

## Default Credentials (Demo Data)

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@clubgo.edu` | `Admin@123` |
| **Faculty Lead** | `faculty@clubgo.edu` | `Faculty@123` |
| **Volunteer** | `volunteer@clubgo.edu` | `Volunteer@123` |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js v18+ (tested on v24.x)
- Docker (optional, for local PostgreSQL) OR a cloud PostgreSQL URL (Supabase / Neon / Railway)

### 1. Start PostgreSQL (Local via Docker)
```bash
docker compose up -d
```
*Or use any PostgreSQL database URL (e.g. Supabase or Neon).*

### 2. Configure Backend Environment
Edit `backend/.env` (or copy from `backend/.env.example`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/clubgo_db?schema=public"
JWT_SECRET="super-secure-jwt-secret-key-clubgo-2026-production"

# Email Delivery (Optional in dev; logs to console if false)
EMAIL_ENABLED=false
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
SMTP_FROM="ClubGo Events <events@university.edu>"
```

### 3. Initialize & Seed Database
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Start the Services
In one terminal (Backend):
```bash
cd backend
npm run dev
```

In another terminal (Frontend):
```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## Production Deployment Guide

### 1. Frontend (Vercel)
1. Push this repository to GitHub.
2. In Vercel, import the project and set the **Root Directory** to `frontend`.
3. Set the Build Command to `npm run build` and Output Directory to `dist`.
4. Add environment variable:
   - `VITE_API_BASE_URL=https://your-backend.up.railway.app`

### 2. Backend (Railway / Render / Fly.io)
1. In Railway or Render, create a new service connected to the repository.
2. Set Root Directory to `backend` (or use the provided `backend/Dockerfile`).
3. Add Environment Variables:
   - `DATABASE_URL`: Your managed PostgreSQL connection string (with pooler mode).
   - `JWT_SECRET`: Random 64-character secret.
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
   - `EMAIL_ENABLED`: `true`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
4. Deploy service.

### 3. Database & Backups (Managed PostgreSQL)
- **Supabase / Neon / Railway**:
  - Enable Automated Daily Backups in the database dashboard.
  - Enable Point-in-Time Recovery (PITR) for disaster recovery.
  - The backend also runs an automated snapshot worker (`node-cron`) every 6 hours saving timestamped dumps into `backups/`.
