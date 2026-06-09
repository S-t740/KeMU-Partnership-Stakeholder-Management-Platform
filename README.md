# Uzury Partnership & Stakeholder Management Platform

A centralized stakeholder intelligence and relationship management platform built for Uzury.

## Technology Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Charts**: Recharts
- **Excel Import**: SheetJS + Fuse.js (fuzzy matching)
- **Deployment**: Vercel

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run the database migration

In your Supabase Dashboard → SQL Editor, run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Platform Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/` | Analytics, KPIs, charts |
| Stakeholders | `/stakeholders` | Master directory with table/grid views |
| Engagements | `/engagements` | Activity timeline grouped by date |
| Opportunities | `/opportunities` | Kanban pipeline + list view |
| Follow-Ups | `/followups` | Overdue/today/week reminders |
| Documents | `/documents` | File repository with drag-and-drop |
| Import | `/import` | 6-step Excel/CSV import wizard |

## Excel Import Wizard

The import wizard supports:
1. **Upload** — XLSX, XLS, CSV drag-and-drop
2. **Preview** — Sheet selection, row count, column preview
3. **Column Mapping** — Auto-detection + manual override
4. **Validation** — Email format, required fields
5. **Duplicate Detection** — Exact + fuzzy matching (Fuse.js) with Merge/Skip/Create options
6. **Import Summary** — Records imported, merged, skipped, errored

## Deployment to Vercel

```bash
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## User Roles

| Role | Access |
|------|--------|
| Administrator | Full CRUD + user management + import |
| Partnership Officer | CRUD on all stakeholder data |
| Executive Management | Read-only dashboards |
