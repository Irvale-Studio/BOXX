# BOXX — Full Application Context Document

Use this document to understand the entire BOXX application — its architecture, features, database, APIs, and business logic. The goal is to discuss how to turn this into a multi-tenant SaaS product that can be sold to many fitness/wellness businesses.

---

## What Is BOXX?

BOXX is a fully-featured studio management platform built for **BOXX Boxing Studio**, a luxury boutique boxing & personal training studio in Chiang Mai, Thailand. It handles everything a small fitness studio needs: public website, member bookings, class scheduling, credit-based payments, email communications, admin management, and an AI assistant.

**Current status:** ~95% complete, single-tenant, approaching production deployment.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript (no TypeScript) |
| Frontend | React 19, Framer Motion, Tailwind CSS v4 |
| UI Components | shadcn/ui (8 components: Button, Card, Input, Label, Badge, Tabs, Dialog, Switch) |
| Database | Supabase (PostgreSQL + Storage + RLS) |
| Auth | NextAuth v5 (JWT) — Google OAuth + email/password |
| Payments | Stripe Connect (OAuth onboarding) + direct purchase bypass |
| Email | Resend (branded HTML templates) |
| AI | Claude API (agentic assistant with tool use) |
| Hosting | Vercel (with cron jobs) |
| Package manager | npm |

---

## Architecture Overview

The app has three main surfaces:

### 1. Public Landing Page (`/`)
A single-page marketing site composed of 14 Framer Motion-animated components:

LoadingScreen → Navbar → Hero → MarqueeBanner → About → Features → Classes → Gallery → Testimonials → Community → Process → CTABanner → FAQ → Contact → Footer + WhatsAppWidget

- Dark luxury aesthetic: black background (#0a0a0a), white text (#ededed), gold accents (#c8a750)
- Fully responsive, scroll-animated
- Contact form, FAQ accordion, gallery grid

### 2. Member Dashboard (`/dashboard`, `/book`, `/buy-classes`, `/my-bookings`, `/profile`)
Protected routes for authenticated members:

- **Dashboard:** Profile widget, active credits display, upcoming classes, gamification (streaks, badges), schedule browser
- **Book:** Calendar/list view of available classes, click-to-book, waitlist support, capacity indicators
- **Buy Classes:** 5 class packs (intro, 1/5/10 classes, unlimited membership), Stripe checkout or direct purchase
- **My Bookings:** Upcoming + past bookings, cancel, add to calendar (.ics export), share via link
- **Profile:** Edit name/phone/bio, avatar upload (Supabase Storage), change password, delete account (GDPR), export data (JSON)
- **Confirmation:** Post-purchase success page

### 3. Admin Panel (`/admin/*`)
Protected routes for staff (admin, employee, owner roles):

- **Dashboard:** Stats cards (members, credits, bookings, revenue), today's classes, engagement widget (at-risk + top members), recent signups
- **Schedule:** Google Calendar-style weekly grid (drag-to-move, resize, click-to-add), recurring class creation, time clash detection, private classes, roster management, cancel/delete
- **Bookings:** Activity timeline (bookings, cancellations, signups, admin actions), filters, CSV export
- **Members:** Searchable list, credit/booking stats, freeze/unfreeze accounts, grant comp credits, view member history
- **Packs:** CRUD for class packs (credits, price, validity, intro/membership flags, display order)
- **Instructors:** CRUD (name, bio, photo, active toggle)
- **Class Types:** CRUD (name, description, duration, color picker, private toggle)
- **Emails:** Compose direct emails, template editor (customize all 15 email types), email log viewer, preview renderer
- **Analytics:** Detailed metrics dashboard
- **Settings:** Studio info, booking rules (capacity, cancellation window, max advance days), reminder toggles, Stripe Connect setup
- **AI Assistant:** Chat interface with Claude — can create/cancel classes, manage roster, send emails, view schedule, grant credits

---

## Database Schema (12 Tables)

### Core Tables

**`users`**
- id, email (unique), name, phone, bio, avatar_url, role ('member'|'admin'|'employee'|'owner'|'frozen'), google_id, password_hash (bcrypt), stripe_customer_id, show_in_roster, created_at

**`class_types`** — Definitions (e.g., "Boxing Fundamentals")
- id, name, description, duration_mins, color, icon, is_private, active

**`instructors`** — Coach profiles
- id, name, bio, photo_url, instagram_url, active

**`class_schedule`** — Scheduled class instances
- id, class_type_id (FK), instructor_id (FK), starts_at, ends_at, capacity (default 6), credits_cost (default 1), status ('active'|'cancelled'), notes, recurring_id (UUID links recurring sets), is_private, created_at

**`bookings`** — Member reservations
- id, user_id (FK), class_schedule_id (FK), credit_id (FK), status ('confirmed'|'invited'|'cancelled'), late_cancel, credit_returned, reminder_24h_sent, reminder_2h_sent, cancelled_at, created_at

**`user_credits`** — Purchased credit packs
- id, user_id (FK), class_pack_id (FK), credits_total, credits_remaining (null = unlimited), expires_at, expiry_warned, stripe_payment_id (unique — idempotency), stripe_sub_id, status ('active'|'expired'|'cancelled'), purchased_at

**`class_packs`** — Purchasable plans
- id, name, description, credits, validity_days, price_thb, stripe_price_id, stripe_product_id, is_membership, is_intro, badge_text, active, display_order

**`waitlist`** — Overflow queue
- id, user_id (FK), class_schedule_id (FK), position (INT), notified, notified_at, created_at
- Unique constraint on (user_id, class_schedule_id)

### Supporting Tables

**`studio_settings`** — Key-value store for all studio configuration (name, address, Stripe tokens, email template overrides, reminder toggles, etc.)

**`admin_audit_log`** — Action trail (admin_id, action, target_type, target_id, details JSONB, ip_address)

**`password_reset_tokens`** — Token-based password recovery (token_hash, expires_at, used)

**`login_attempts`** — Auth audit (email, ip_address, success, attempted_at)

### AI Assistant Tables

**`agent_conversations`** — Chat threads (user_id, title)
**`agent_messages`** — Messages (conversation_id, role, content, tool_results JSONB)
**`agent_memory`** — User pattern extraction (user_id, patterns JSONB)
**`agent_usage`** — Token tracking per user per month (input_tokens, output_tokens, cost_usd)

### Analytics Tables

**`email_log`** — All sent emails (type, recipient, subject, status, error, resend_id)
**`page_views`** — Landing page analytics (path, referrer, utm_*, device_type)

### Database Functions (Atomic Operations)

```sql
deduct_credit(credit_id UUID) → BOOLEAN    -- Atomic credit deduction, returns false if insufficient
restore_credit(credit_id UUID) → VOID      -- Atomic credit restore (rollback on booking failure)
increment_agent_usage(...)    → VOID        -- Atomic upsert for AI token tracking
```

### Row-Level Security

- **Public read:** class_types, instructors, class_schedule, class_packs, studio_settings
- **User-scoped:** users (own record), bookings (own), user_credits (own), waitlist (own)
- **Admin tables:** admin_audit_log (API-enforced, not RLS)

---

## API Routes (40+ endpoints)

### Auth (5 routes)
- NextAuth handler (Google OAuth + Credentials)
- Registration (bcrypt, rate limited 5/15min per IP)
- Forgot password (token generation + email)
- Reset password (token consumption)

### Member Routes (14 routes)
- `GET /api/dashboard` — Full user data (credits, bookings, schedule)
- `GET /api/schedule` — Public class listing (respects is_private)
- `POST /api/bookings/create` — Book class (capacity check, credit deduction, atomic)
- `POST /api/bookings/cancel` — Cancel booking (refund logic, late-cancel tracking)
- `POST /api/bookings/accept-invitation` — Accept private class invite
- `GET /api/bookings/ical` — Calendar file download
- `POST /api/waitlist/join|leave` — Waitlist management
- `POST /api/profile` — Update profile
- `POST /api/profile/avatar` — Upload to Supabase Storage
- `POST /api/profile/password` — Change password (rate limited)
- `DELETE /api/profile` — Delete account (cascade + anonymize)
- `GET /api/profile/export` — GDPR/PDPA data export
- `POST /api/packs/purchase` — Buy class pack
- `GET /api/packs` — List active packs

### Stripe Routes (3 routes)
- `POST /api/stripe/checkout` — Create Stripe checkout session
- `POST /api/stripe/portal` — Billing portal link
- `POST /api/stripe/webhook` — Handle payment events (checkout.session.completed, invoice.*, subscription.deleted)

### Admin Routes (30+ routes)
- Dashboard stats, analytics
- Schedule CRUD (create, edit, cancel, delete, recurring, notify, roster management)
- Bookings/activity log with filters
- Members CRUD (list, detail, grant credits, freeze, delete)
- Packs, Instructors, Class Types CRUD
- Email compose, template editor, log viewer, preview
- Settings (studio info, booking rules, reminders, Stripe setup)
- AI assistant (send message, conversation CRUD)

### Cron Routes (4 jobs via Vercel)
- **Every hour:** Class reminders (1hr before class)
- **Every 15min:** Waitlist processing (safety net promotion)
- **Daily 17:00 UTC:** Credit expiry (mark expired, send 3-day warnings)
- **Daily 03:00 UTC:** Agent conversation cleanup (>30 days)

---

## Key Business Logic

### Class Booking Flow
1. Check capacity (confirmed bookings < capacity)
2. Find best credit pack (ordered by expiry, ascending)
3. Atomically deduct credit (`deduct_credit()` SQL function)
4. Create booking (status='confirmed')
5. Send confirmation email
6. If ≤1 credit remaining → send low credits warning
7. On failure → restore credit via `restore_credit()`

### Cancellation Logic
- **Free cancellation:** >12 hours before class → refund credit, mark late_cancel=false
- **Late cancellation:** ≤12 hours → still refund credit, but mark late_cancel=true (tracked for stats)
- Both trigger cancellation confirmation email

### Waitlist Promotion
Triggered when a spot opens (member cancels, admin removes from roster):
1. Check if spot available
2. Get first waitlisted user (by position)
3. Verify user has valid credits
4. Create booking + deduct credit
5. Remove from waitlist, reorder positions
6. Send promotion email

### Private Classes
- `is_private` flag on class_types and class_schedule
- Hidden from public schedule
- Admin adds members via roster → creates "invited" booking
- Member accepts invitation on dashboard → status changes to "confirmed"
- Sends private class invitation email

### Recurring Classes
- Admin creates with days-of-week + number of weeks (or "every week" forever)
- All instances share a `recurring_id` UUID
- Edit options: single instance, all future, or unlink from series
- Cancel options: single or all future

### Credit System
- Packs have fixed credits (1, 5, 10) or unlimited (null credits_remaining)
- Validity period (e.g., 30/60/90 days from purchase)
- Auto-expire via cron job
- 3-day expiry warning email
- Stripe payment idempotency (stripe_payment_id unique constraint)

---

## Email System (Resend — 15 Templates)

All emails use a branded dark-theme HTML template (BOXX logo, gold accents, footer with address/social links).

| # | Email Type | Trigger |
|---|-----------|---------|
| 1 | Booking confirmation | Member books class |
| 2 | Class reminder (1hr) | Cron job |
| 3 | Waitlist promotion | Spot opens |
| 4 | Credit expiry warning (3-day) | Cron job |
| 5 | Welcome email | User registers |
| 6 | Cancellation confirmation | Member cancels |
| 7 | Class cancelled by admin | Admin cancels class |
| 8 | Class change notification | Admin edits class |
| 9 | Pack purchase confirmation | Stripe webhook / direct purchase |
| 10 | Credits low warning | Booking reduces credits to ≤1 |
| 11 | Admin direct email | Admin sends from email page |
| 12 | Removed from class | Admin removes from roster |
| 13 | Added to class by admin | Admin adds to roster |
| 14 | Private class invitation | Admin adds to private class |
| 15 | Password reset | User requests reset |

**Customizable:** Admins can override subject/body for each template type via Settings.
**Logged:** All sends tracked in email_log table (type, recipient, status, error).
**Rate limited:** Platform-wide limits (100/day, 3000/month) with alerts at 80% and 100%.

---

## Payment Integration (Stripe Connect)

### Setup Flow
1. Admin clicks "Connect Stripe" in Settings
2. Redirects to Stripe Connect OAuth
3. After authorization, access token stored in studio_settings
4. Packs can now be purchased via Stripe checkout

### Purchase Flow
1. Member selects pack → creates Stripe checkout session
2. Stripe handles payment (PCI compliant)
3. On success → webhook fires → credits allocated to user_credits
4. Idempotency via stripe_payment_id unique constraint
5. Subscription renewals handled via invoice.payment_succeeded webhook

### Direct Purchase (Dev/Testing)
- Environment variable `ENABLE_DIRECT_PURCHASE=true` bypasses Stripe
- Allocates credits immediately without payment

---

## Gamification System

- **Streaks:** Consecutive weeks with at least one class
- **Stats:** Total classes, longest streak, unique class types, morning/evening preferences
- **12 Badges:** Milestone (First Class, 10/25/50/100), Streak (3-week, 2-month, quarter), Variety (3 types, all types), Time (Early Bird, Night Owl)
- Computed client-side from booking history

---

## AI Assistant (Admin Only)

- Chat interface at `/admin/assistant`
- Powered by Claude API with tool use (agentic)
- **Available tools:** create_class, create_recurring_classes, cancel_class, get_schedule, delete_class, add_member_to_class, remove_member_from_class, promote_from_waitlist, send_class_changed_email, send_email_to_member, get_members, grant_credits
- Conversation history persisted in database
- Token usage tracked per user per month
- Auto-cleanup of old conversations via cron

---

## Auth & Security

### Authentication
- **Providers:** Google OAuth + email/password (bcrypt, cost 10)
- **Sessions:** JWT-based, 30-day member / 8-hour admin expiry
- **Middleware:** Protects member + admin routes, blocks frozen accounts, restricts employee access

### Role-Based Access
- **member** — Standard user (book, buy, view profile)
- **employee** — Limited admin (schedule, roster, bookings — no settings or packs)
- **admin** — Full admin access
- **owner** — Admin + revenue visibility + destructive actions
- **frozen** — Blocked from login (reversible by admin)

### Security Measures
- Rate limiting on registration, password reset, bookings (in-memory — needs Redis for production)
- Input validation (Zod schemas on all API routes)
- HTML escaping in emails (prevent XSS)
- RLS on all user-facing tables
- Admin audit logging (action, target, details, IP)
- Stripe webhook signature verification
- CRON_SECRET for cron job authentication

---

## Hosting & Deployment

- **Vercel:** Automatic deployment on push to main
- **Cron jobs:** Configured in vercel.json (4 scheduled tasks)
- **Domain:** boxxthailand.com
- **Environment:** 15+ env vars (NextAuth, Google, Supabase, Stripe, Resend, Anthropic)

---

## What's Working vs. What's Not

### Fully Working
- All auth flows (login, register, Google OAuth, password reset, frozen accounts)
- Full booking lifecycle (book, cancel, waitlist, promotion, late-cancel tracking)
- Credit system (purchase, deduction, expiry, refunds, unlimited packs)
- Admin schedule management (CRUD, recurring, roster, drag-and-drop calendar)
- Member dashboard (profile, credits, bookings, gamification, calendar export)
- All 15 email templates (coded and tested)
- Stripe Connect integration (checkout, webhooks, subscriptions)
- Admin panel (all 11 pages functional)
- AI assistant with tool use
- Landing page with animations

### Needs Work for Production
- Email domain verification (SPF/DKIM/DMARC on Resend)
- Production Stripe keys + webhook endpoint
- Rate limiting needs Redis (in-memory resets on cold starts)
- Instructor photo upload (form exists, upload logic missing)
- Advanced analytics/reporting dashboards

### Not Yet Built (Future)
- Referral program (spec exists)
- White-label multi-tenant support (spec exists)
- Push notifications
- Instructor availability scheduling
- Bulk member import
- Holiday/closure management

---

## File Structure Summary

```
src/
├── app/
│   ├── (admin)/admin/          # 11 admin pages
│   ├── (member)/               # 6 member pages
│   ├── api/                    # 40+ API routes
│   ├── page.js                 # Landing page (composes 14 components)
│   ├── layout.js               # Root layout (Geist font, SEO meta)
│   ├── globals.css             # Tailwind v4 theme (CSS variables)
│   └── login/, register/, etc. # Auth pages
├── components/
│   ├── ui/                     # 8 shadcn/ui primitives
│   └── *.js                    # 16 landing page components
├── lib/
│   ├── auth.js                 # NextAuth config
│   ├── admin-auth.js           # Role-based access helpers
│   ├── email.js                # 15 email templates + Resend
│   ├── stripe.js               # Stripe initialization
│   ├── gamification.js         # Streaks, badges, stats
│   ├── rate-limit.js           # In-memory rate limiter
│   ├── platform-limits.js      # Free tier limits
│   ├── waitlist.js             # Promotion logic
│   ├── utils.js                # cn() utility
│   ├── supabase/client.js      # Public Supabase client
│   ├── supabase/admin.js       # Server-side Supabase client
│   └── agent/                  # AI assistant (executor, tools, conversations, usage)
├── middleware.js                # Route protection
supabase/
├── schema.sql                  # Full DB schema (12 tables + RLS + functions)
├── seed.sql                    # Test data
docs/
├── dev-spec.md                 # Master task tracker
├── brand-reference.md          # Brand guidelines
├── whitelabel-spec.md          # White-label feasibility spec
├── referral-spec.md            # Referral program spec
├── security-audit.md           # 19 findings (all fixed)
```

---

## Key Numbers

- **12** database tables + RLS policies
- **40+** API routes
- **15** branded email templates
- **4** cron jobs
- **11** admin pages
- **6** member pages
- **14** landing page components
- **8** shadcn/ui components
- **12** gamification badges
- **4** user roles (member, employee, admin, owner)
- **5** class packs (intro, 1/5/10, unlimited)

---

## Discussion Context: SaaS Transformation

This app currently serves a single studio (BOXX Thailand). The goal is to turn it into a multi-tenant SaaS product that any fitness/wellness studio can sign up for and use. Key questions to discuss:

1. **Tenancy model:** Shared database with tenant_id columns vs. database-per-tenant vs. schema-per-tenant
2. **Onboarding:** Self-service signup, Stripe Connect for each tenant, custom domain/subdomain
3. **Customization:** Branding (colors, logo, fonts), landing page builder, email template customization (partially built)
4. **Pricing model:** Per-studio subscription, usage-based, freemium
5. **What's already tenant-ready:** studio_settings KV store, email template overrides, Stripe Connect OAuth
6. **What needs the most work:** Database schema (adding tenant_id), auth (multi-tenant sessions), landing page (per-studio customization), admin isolation
7. **Infrastructure:** Supabase multi-tenancy patterns, Vercel multi-tenant hosting, domain routing
8. **AI assistant costs:** Per-tenant token tracking already built, but need billing/limits strategy
9. **Competitive landscape:** Mindbody, Glofox, Momoyoga, Gymdesk — where does this fit?
10. **MVP scope:** What's the minimum to get a second studio onboarded?
