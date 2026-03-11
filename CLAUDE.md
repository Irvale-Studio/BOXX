# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npm run lint` — ESLint (flat config, Next.js preset)

## Architecture

Multi-tenant SaaS studio management platform. Next.js 16 App Router with three route groups:

- `(admin)` — Admin panel (schedule, members, bookings, packs, class types, instructors, analytics, emails, settings, AI assistant)
- `(member)` — Member area (dashboard, book classes, my bookings, buy classes, profile)
- `api/` — 52 API routes (auth, member, admin, cron, stripe, AI agent)

**Key files:**
- `src/lib/auth.js` — NextAuth v5 config (Google OAuth + credentials)
- `src/lib/admin-auth.js` — Role-based access helpers (requireStaff/Admin/Owner)
- `src/lib/email.js` — 15 Resend email templates
- `src/lib/platform-limits.js` — Per-tenant resource limits
- `src/lib/stripe.js` — Stripe Connect configuration
- `src/lib/waitlist.js` — Waitlist promotion logic
- `src/lib/gamification.js` — Badges and streaks
- `supabase/schema.sql` — Full database schema

## Database

Supabase (Postgres) with Row Level Security. Tables include: users, class_types, instructors, class_schedule, bookings, user_credits, class_packs, waitlist, studio_settings, admin_audit_log, email_log, page_views, plus AI agent tables.

Multi-tenancy via `tenant_id` on every table (migration in progress — see dev spec).

## Design Tokens (globals.css)

Use Tailwind classes mapped to CSS variables — do not use raw hex values:

| Tailwind class    | Variable         | Value    |
|-------------------|------------------|----------|
| `bg-background`   | `--background`   | #0a0a0a  |
| `text-foreground` | `--foreground`   | #f5f5f5  |
| `text-accent`     | `--accent`       | #c8a750  |
| `text-accent-dim` | `--accent-dim`   | #a08535  |
| `bg-cta`          | `--cta`          | #f5efe6  |
| `bg-cta-hover`    | `--cta-hover`    | #e8dfd2  |
| `text-muted`      | `--muted`        | #888888  |
| `bg-card`         | `--card`         | #111111  |
| `border-card-border` | `--card-border` | #1a1a1a |

## Task Tracking

All task tracking lives in **`docs/saas-dev-spec.md`** — this is the single source of truth. Read it at the start of each session and update it after completing features.

## Key Conventions

- JavaScript only (no TypeScript)
- shadcn/ui components for admin/member pages (Button, Card, Input, Label, Badge, Tabs, Dialog, Switch)
- `cn()` from `@/lib/utils` for combining Tailwind classes
- Dark luxury aesthetic: black backgrounds, white text, gold (#c8a750) accents
- UI interactions should feel polished and layered — use subtle hover states, smooth transitions, and progressive disclosure rather than abrupt show/hide
- Images are WebP in `public/images/`
- Confirm with user before starting next phase of work
