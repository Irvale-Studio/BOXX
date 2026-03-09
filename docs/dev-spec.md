# BOXX Development Spec & Progress Tracker

> Last updated: 2026-03-09 (Batch 1 complete)

---

## Status Key

- [x] Complete
- [ ] Not started
- [~] Partially done

---

## Phase 1 — Homepage & Marketing Site

- [x] Hero section with CTA
- [x] Navbar with auth links
- [x] About section (founder bio, studio story)
- [x] Features/benefits section
- [x] Classes section (4 class types, expandable cards)
- [x] Gallery (5-image grid)
- [x] Testimonials
- [x] Community section (animated 2x2 grid, cycling featured image)
- [x] Process ("How to get started")
- [x] CTA Banner
- [x] FAQ accordion
- [x] Contact form + details
- [x] Footer with social links
- [x] Loading screen
- [x] Marquee banner
- [x] Favicon + OG image generation (sharp)
- [x] SEO metadata
- [x] Security headers (HSTS, X-Frame-Options, CSP, etc.)
- [x] Responsive / mobile

---

## Phase 2 — Auth & Payments

### 2.1 Authentication
- [x] NextAuth setup (JWT strategy)
- [x] Google OAuth provider
- [x] Email/password credentials provider (bcrypt)
- [x] Registration page + API (`/api/auth/register`)
- [x] Login page (Google + email/password)
- [x] Middleware: protect member routes, protect admin routes (role check)
- [x] Admin session expiry (8 hours)
- [x] Rate limiting on registration (5/15min per IP)

### 2.2 Stripe Payments
- [x] Stripe Connect OAuth flow (studio connects their account)
- [x] Checkout session creation (`/api/stripe/checkout`)
- [x] Webhook handler (payment success → credit allocation)
- [x] Billing portal link (`/api/stripe/portal`)
- [x] Buy Classes page (pack cards with Stripe checkout)
- [x] Confirmation page (post-purchase)

---

## Phase 3 — Member Dashboard

### 3.1 Core Dashboard
- [x] Dashboard API (`/api/dashboard`) — user data, credits, schedule
- [x] Profile section (avatar, name, phone, bio, roster toggle)
- [x] Avatar upload (`/api/profile/avatar` → Supabase storage)
- [x] Credit packs display (expandable, color-coded health)
- [x] Schedule view (calendar + list, week navigation)
- [x] Class booking flow (credit deduction, capacity check)
- [x] Booking cancellation (free vs late cancel logic)
- [x] Class roster display (avatars of booked members)
- [x] Share class link
- [x] My Bookings tab (upcoming + past, expandable cards)

### 3.2 Waitlist
- [x] Join waitlist API (`/api/waitlist/join`)
- [x] Leave waitlist API (`/api/waitlist/leave`)
- [x] Waitlist UI in schedule view (join/leave buttons, position badge)

### 3.3 Account Management
- [x] Change password API (`/api/profile/password`) — rate limited
- [x] Delete account API (`DELETE /api/profile`) — cascading cleanup, anonymization
- [x] Data export API (`/api/profile/export`) — GDPR/PDPA JSON download
- [x] Account Settings UI in dashboard (password, export, delete)

### 3.4 Calendar Download
- [x] .ics file generation (`/api/bookings/ical`)
- [x] Calendar icon on booked classes (schedule + my bookings)

---

## Phase 4 — Admin Panel: Schedule & Classes

- [x] Admin dashboard page (stats: members, credits, bookings, revenue)
- [x] Admin dashboard API (`/api/admin/dashboard`)
- [x] Today's classes with capacity indicators
- [x] Recent signups list
- [x] Low-credit member alerts
- [x] Schedule management page (weekly calendar, 7-column grid)
- [x] Create class (dialog + form, class type + instructor selects)
- [x] Edit class
- [x] Cancel class API (`/api/admin/schedule/cancel`) — cascading: cancel bookings → refund credits → clear waitlist
- [x] Schedule options API (`/api/admin/schedule/options`)

---

## Phase 5 — Admin Panel: Bookings, Members, Packs, Instructors

### 5.1 Bookings Management
- [x] Bookings list page (paginated, filterable by status/date)
- [x] Bookings API (`/api/admin/bookings`)

### 5.2 Members Management
- [x] Members list page (searchable, credits + booking counts)
- [x] Members API (`/api/admin/members`)
- [x] Grant credits (comp session) — API + dialog UI

### 5.3 Packs Management
- [x] Packs CRUD page (create/edit/toggle active)
- [x] Packs API (`/api/admin/packs`) — GET, POST, PUT

### 5.4 Instructors Management
- [x] Instructors CRUD page (name, bio, photo, Instagram, active toggle)
- [x] Instructors API (`/api/admin/instructors`) — GET, POST, PUT

---

## Phase 6 — Email & Cron Jobs

- [x] Email service (`src/lib/email.js`) — Resend, branded HTML templates
- [x] Booking confirmation email (wired into `/api/bookings/create`)
- [x] Class reminder cron (`/api/cron/reminders`) — 1hr before, every 15min
- [x] Credit expiry cron (`/api/cron/expire-credits`) — daily, zeros expired + warns 3-day
- [x] Waitlist processing cron (`/api/cron/process-waitlist`) — every 5min, auto-book + email
- [x] Vercel cron config (`vercel.json`)

**Env vars needed:** `RESEND_API_KEY`, `CRON_SECRET`

---

## Phase 7 — Security & Polish

- [x] Rate limiting on auth endpoints (`src/lib/rate-limit.js`)
- [x] Security headers (next.config.mjs)
- [x] Input validation (Zod on all API routes)
- [x] RLS policies on all tables
- [x] Admin audit logging

---

## TODO — Not Yet Started

### Admin Panel — Member Management
- [x] **Member detail view** — click member → full profile, booking history, credit history, waitlist, stats
- [x] **Member edit** — admin can edit member profile (name, email, phone, role)
- [x] **Member delete/deactivate** — cascading: cancel bookings, void credits, clear waitlist, anonymize
- [x] **Member stats** — total bookings, attendance rate, last visit, active credits
- [ ] **Member credit management** — view full credit history, adjust credits, void packs
- [ ] **Internal notes** — admin-only notes on member records

### Admin Panel — Bookings & Schedule
- [x] **Booking cancel on behalf** — admin can cancel a member's booking (with optional credit refund)
- [x] **Mark attendance** — attended / no-show buttons on bookings
- [x] **Recurring class generation** — day picker + weeks selector, grouped by recurring_id
- [x] **Class roster view** — click booking count in admin schedule to see full roster
- [x] **Private classes** — `is_private` on class_types, auto-applied to scheduled classes, hidden from public schedule
- [x] **Recurring in add class** — recurring toggle in main add class form (days + weeks), no separate dialog
- [x] **Notify members on class change** — popup after editing a class with bookings, stub API ready for Resend
- [ ] **Booking override** — admin can manually book a member into a class (bypass capacity/credits)
- [ ] **CSV export** of bookings

### Admin Panel — Private Classes (remaining)
- [ ] **Add members to private class** — admin selects users to add, auto-creates bookings
- [ ] **Private class notifications** — email members when added to a private class

### Admin Panel — Other
- [ ] **Admin activity feed** — view admin audit log in UI
- [ ] **Pack reorder** — drag to change display_order
- [ ] **Instructor photo upload** to Supabase Storage

### Admin Settings (remaining tabs)
- [ ] **Studio Info tab** — name, address, phone, email, website
- [ ] **Booking Rules tab** — capacity default, cancellation window, waitlist claim hours
- [ ] **Reminders tab** — toggle 24h/2h reminders, edit reminder copy
- [ ] **Roster tab** — default show/hide setting
- [ ] **Data tab** — export all data, danger zone

### Email Notifications (all need `RESEND_API_KEY`)

**Already coded (need Resend API key to activate):**
- [ ] Booking confirmation email (in `/api/bookings/create`)
- [ ] Class reminder — 1hr before (in `/api/cron/reminders`)
- [ ] Waitlist promotion notification (in `/api/cron/process-waitlist`)
- [ ] Credit expiry warning — 3 days (in `/api/cron/expire-credits`)

**Stub/API ready, email template needed:**
- [ ] Class change notification — admin edits class, notify booked members (`/api/admin/schedule/notify`)
- [ ] Private class invitation — admin adds member to private class

**Not yet built:**
- [ ] Welcome email on registration
- [ ] Cancellation confirmation email (member cancels booking)
- [ ] Class cancelled by admin — notify booked members
- [ ] Pack purchase confirmation email
- [ ] Credits low warning email (1 credit remaining)
- [ ] Admin direct email to individual member
- [ ] Password reset email (token-based link)

### Dashboard Enhancements
- [ ] Password reset / forgot password flow (token-based, email link)
- [ ] Google account linking (merge email + Google accounts)

### Reporting
- [ ] Revenue reports (daily/weekly/monthly)
- [ ] Attendance reports (by class, by instructor, by time)
- [ ] Member retention / churn metrics
- [ ] Export reports to CSV

### Infrastructure
- [ ] **Set up env vars** — `RESEND_API_KEY` (Resend email), `CRON_SECRET` (cron job auth)
- [ ] Vercel deployment config
- [ ] Custom domain setup
- [ ] Supabase production environment
- [ ] Stripe production keys + webhook endpoint
- [ ] Resend domain verification
- [ ] **Run migration SQL** — add `expiry_warned` column to `user_credits` table (see schema.sql)
- [ ] **Run migration SQL** — add `is_private BOOLEAN DEFAULT false` column to `class_schedule` table
- [ ] **Run migration SQL** — add `is_private BOOLEAN DEFAULT false` column to `class_types` table

### Quality
- [ ] Mobile QA pass on all member pages
- [ ] Accessibility audit (ARIA, keyboard nav, contrast)
- [ ] Loading states and error boundaries on all pages
- [ ] Empty states for all lists
- [ ] 404 page

---

## Database Schema (12 tables)

| Table | Purpose |
|-------|---------|
| `users` | Auth & profiles |
| `password_reset_tokens` | Password recovery |
| `login_attempts` | Login audit |
| `class_types` | Class definitions |
| `instructors` | Coach profiles |
| `class_schedule` | Scheduled classes |
| `class_packs` | Purchasable packs |
| `user_credits` | Member credit balances |
| `bookings` | Class bookings |
| `waitlist` | Overflow queue |
| `admin_audit_log` | Admin actions |
| `studio_settings` | KV config store |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** JavaScript (no TypeScript)
- **Styling:** Tailwind CSS v4 + Framer Motion
- **Auth:** NextAuth v5 (Google OAuth + Credentials)
- **Database:** Supabase (Postgres + Storage)
- **Payments:** Stripe (Connect model)
- **Email:** Resend
- **UI Components:** shadcn/ui (Button, Card, Input, Label, Badge, Tabs, Dialog, Switch)
- **Hosting:** Vercel (planned)
