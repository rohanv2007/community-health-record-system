# Community Health Record System

![Community Health Record System banner](public/banner.svg)

A full-stack clinic operations system for small clinics and rural health centers.

**Live Demo:** [deployed Vercel URL]

## Features

- 🧑‍⚕️ Patient registry with search, pagination, profile photos, detail tabs, lab reports, and PDF summaries
- 📅 Appointment booking with doctor conflict detection and status workflows
- 💊 Prescription creation with medicine items and downloadable PDFs
- 🧾 Billing, invoices, payments, tax calculation, and branded invoice PDFs
- 🔐 Role-based access for Admin, Doctor, and Receptionist users
- 🗄️ Supabase Auth, RLS-protected PostgreSQL data, and Storage uploads
- 🌗 Responsive premium SaaS UI with fixed sidebar, dark mode, charts, sheets, skeleton-ready states, and Sonner toasts

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-14-0F172A?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn-ui-111827)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel)

## Screenshots

![Dashboard](public/screenshots/dashboard.png)
![Patients](public/screenshots/patients.png)
![Billing](public/screenshots/billing.png)

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@healthpoint.com` | `Demo@1234` |
| Doctor | `doctor@healthpoint.com` | `Demo@1234` |
| Receptionist | `reception@healthpoint.com` | `Demo@1234` |

## Local Development

```bash
npm install
cp .env.example .env.local
npm run build
npm run dev
```

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Apply the SQL migration in `supabase/migrations`, then seed demo data:

```bash
npx ts-node --project tsconfig.scripts.json scripts/seed.ts
```

## Testing

```bash
npx jest --coverage
npm run test:integration
npx playwright test --reporter=html
npm run build
```

Latest local validation:

- Jest coverage: 91.86% statements across validation, permissions, date, and invoice utilities
- Supabase integration: 5/5 passing with live RLS checks
- Playwright E2E: 10/10 passing
- Lighthouse desktop on `/login`: Performance 100, Accessibility 96, Best Practices 100, SEO 91

## Database Schema

```mermaid
erDiagram
  clinics ||--o{ profiles : has
  clinics ||--o{ patients : owns
  clinics ||--o{ appointments : schedules
  clinics ||--o{ invoices : bills
  patients ||--o{ appointments : books
  patients ||--o{ prescriptions : receives
  patients ||--o{ invoices : receives
  patients ||--o{ lab_reports : stores
  profiles ||--o{ appointments : doctor
  appointments ||--|| prescriptions : produces
  prescriptions ||--o{ prescription_items : contains
  invoices ||--o{ invoice_items : contains
  invoices ||--o{ payments : records
```

## License

MIT
