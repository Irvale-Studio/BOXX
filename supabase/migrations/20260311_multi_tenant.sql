-- ═══════════════════════════════════════════════════════════════
-- PHASE 1: Multi-Tenant Database Migration
--
-- This migration adds multi-tenancy to all existing tables.
-- Bert's BOXX Boxing Studio becomes Tenant #1.
-- All existing data is backfilled to that tenant.
--
-- IMPORTANT: Run this in a transaction. If anything fails,
-- the entire migration rolls back.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────
-- 1. NEW TABLES
-- ─────────────────────────────────────

-- Tenants (one per business)
CREATE TABLE tenants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  custom_domain  TEXT UNIQUE,
  vertical       TEXT NOT NULL DEFAULT 'boxing',
  plan           TEXT NOT NULL DEFAULT 'free',
  logo_url       TEXT,
  primary_color  TEXT DEFAULT '#c8a750',
  timezone       TEXT DEFAULT 'UTC',
  currency       TEXT DEFAULT 'USD',
  stripe_customer_id TEXT,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;

-- Locations (physical sites per tenant)
CREATE TABLE locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT,
  city        TEXT,
  country     TEXT,
  phone       TEXT,
  timezone    TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_locations_tenant_id ON locations(tenant_id);

-- Staff-tenant membership (users can belong to multiple tenants)
CREATE TABLE staff_tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',
  location_ids UUID[] DEFAULT '{}',
  invited_at  TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

CREATE INDEX idx_staff_tenants_user_id ON staff_tenants(user_id);
CREATE INDEX idx_staff_tenants_tenant_id ON staff_tenants(tenant_id);

-- Plan limits (reference table)
CREATE TABLE plan_limits (
  plan              TEXT PRIMARY KEY,
  max_locations     INT NOT NULL,
  max_members       INT NOT NULL,
  max_ai_queries    INT NOT NULL,
  max_classes_month INT NOT NULL DEFAULT 9999,
  max_instructors   INT NOT NULL DEFAULT 9999,
  max_class_types   INT NOT NULL DEFAULT 9999,
  max_packs         INT NOT NULL DEFAULT 9999
);

INSERT INTO plan_limits (plan, max_locations, max_members, max_ai_queries, max_classes_month, max_instructors, max_class_types, max_packs) VALUES
  ('free',       1,    30,       0, 50,   5,  10, 5),
  ('starter',    1,   150,      50, 200, 10,  20, 10),
  ('growth',     3,   500,     300, 500, 20,  30, 20),
  ('pro',       10,  2000,    1000, 9999, 9999, 9999, 9999),
  ('enterprise', 9999, 99999, 99999, 9999, 9999, 9999, 9999);

-- Feature flags (master definitions)
CREATE TABLE feature_flags (
  key               TEXT PRIMARY KEY,
  description       TEXT,
  default_enabled   BOOLEAN DEFAULT false,
  enabled_for_plans TEXT[] DEFAULT '{}',
  is_killed         BOOLEAN DEFAULT false,
  rollout_pct       INT DEFAULT 100,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Per-tenant feature flag overrides
CREATE TABLE tenant_feature_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  flag_key    TEXT NOT NULL REFERENCES feature_flags(key) ON DELETE CASCADE,
  enabled     BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, flag_key)
);

CREATE INDEX idx_tenant_feature_flags_tenant_id ON tenant_feature_flags(tenant_id);

-- Seed feature flags
INSERT INTO feature_flags (key, description, default_enabled, enabled_for_plans) VALUES
  ('ai_assistant',            'AI assistant for admin',                false, '{starter,growth,pro,enterprise}'),
  ('sms_notifications',       'SMS messaging channel',                false, '{starter,growth,pro,enterprise}'),
  ('discount_codes',          'Promo and discount codes',             false, '{starter,growth,pro,enterprise}'),
  ('check_in_system',         'QR code class check-in',              false, '{starter,growth,pro,enterprise}'),
  ('appointment_booking',     '1:1 appointment mode',                false, '{starter,growth,pro,enterprise}'),
  ('custom_domain',           'Custom domain support',               false, '{growth,pro,enterprise}'),
  ('remove_branding',         'Remove SaaS watermark',               false, '{growth,pro,enterprise}'),
  ('multi_location',          'Multiple locations',                   false, '{growth,pro,enterprise}'),
  ('referral_system',         'Member referral program',             false, '{growth,pro,enterprise}'),
  ('forms_and_waivers',       'Digital forms and waivers',           false, '{growth,pro,enterprise}'),
  ('gift_cards',              'Gift card purchases',                 false, '{growth,pro,enterprise}'),
  ('lead_crm',                'Lead management pipeline',            false, '{growth,pro,enterprise}'),
  ('review_management',       'Post-class reviews',                  false, '{growth,pro,enterprise}'),
  ('whatsapp',                'WhatsApp messaging',                  false, '{growth,pro,enterprise}'),
  ('telegram',                'Telegram messaging',                  false, '{growth,pro,enterprise}'),
  ('line_messaging',          'LINE messaging',                      false, '{growth,pro,enterprise}'),
  ('cancel_fees',             'Late cancel / no-show fees',          false, '{growth,pro,enterprise}'),
  ('family_accounts',         'Linked family accounts',              false, '{growth,pro,enterprise}'),
  ('data_import',             'CSV data import',                     false, '{growth,pro,enterprise}'),
  ('instructor_availability', 'Instructor availability management',  false, '{growth,pro,enterprise}'),
  ('retention_engine',        'Automated retention actions',         false, '{pro,enterprise}'),
  ('advanced_analytics',      'Advanced analytics dashboards',       false, '{pro,enterprise}'),
  ('api_access',              'Public API access',                   false, '{pro,enterprise}'),
  ('white_label',             'Full white-label branding',           false, '{enterprise}');


-- ─────────────────────────────────────
-- 2. SEED BERT'S TENANT
-- ─────────────────────────────────────

INSERT INTO tenants (id, name, slug, vertical, plan, timezone, currency, primary_color, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'BOXX Boxing Studio',
  'boxx',
  'boxing',
  'pro',
  'Asia/Bangkok',
  'THB',
  '#c8a750',
  true
);

INSERT INTO locations (id, tenant_id, name, address, city, country, phone, timezone)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'BOXX Chiang Mai',
  '89/2 Bumruang Road, Wat Ket',
  'Chiang Mai',
  'Thailand',
  '+66 93 497 2306',
  'Asia/Bangkok'
);

-- Override all feature flags to enabled for Bert
INSERT INTO tenant_feature_flags (tenant_id, flag_key, enabled)
SELECT 'a0000000-0000-0000-0000-000000000001', key, true
FROM feature_flags;


-- ─────────────────────────────────────
-- 3. ADD tenant_id TO EXISTING TABLES
-- ─────────────────────────────────────

-- Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Class types
ALTER TABLE class_types ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Instructors
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Class schedule
ALTER TABLE class_schedule ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE class_schedule ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Class packs
ALTER TABLE class_packs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- User credits
ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Waitlist
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Studio settings — needs restructuring from simple key-value to tenant-scoped
ALTER TABLE studio_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Admin audit log
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Email log
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Page views
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Agent tables
ALTER TABLE agent_conversations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE agent_usage ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Login attempts (shared across tenants but useful to scope)
ALTER TABLE login_attempts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Password reset tokens
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);


-- ─────────────────────────────────────
-- 4. BACKFILL ALL EXISTING DATA
-- ─────────────────────────────────────

UPDATE users SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE class_types SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE instructors SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE class_schedule SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE class_schedule SET location_id = 'b0000000-0000-0000-0000-000000000001' WHERE location_id IS NULL;
UPDATE class_packs SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE bookings SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE user_credits SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE waitlist SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE studio_settings SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE admin_audit_log SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE email_log SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE page_views SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE agent_conversations SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE agent_messages SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE agent_memory SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE agent_usage SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE login_attempts SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE password_reset_tokens SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- Create staff_tenants entries for existing staff
INSERT INTO staff_tenants (user_id, tenant_id, role)
SELECT id, 'a0000000-0000-0000-0000-000000000001', role
FROM users
WHERE role IN ('owner', 'admin', 'employee')
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Also create entries for all members
INSERT INTO staff_tenants (user_id, tenant_id, role)
SELECT id, 'a0000000-0000-0000-0000-000000000001', 'member'
FROM users
WHERE role = 'member'
ON CONFLICT (user_id, tenant_id) DO NOTHING;


-- ─────────────────────────────────────
-- 5. APPLY NOT NULL CONSTRAINTS
-- (only after backfill is confirmed)
-- ─────────────────────────────────────

ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE class_types ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE instructors ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE class_schedule ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE class_packs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE user_credits ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE waitlist ALTER COLUMN tenant_id SET NOT NULL;

-- These are less critical — some rows might legitimately not have tenant_id
-- (e.g., page_views from unauthenticated visitors)
-- So we leave them nullable for now

-- Studio settings: update PK to be composite (tenant_id, key)
-- Drop old PK, add new composite PK
ALTER TABLE studio_settings DROP CONSTRAINT IF EXISTS studio_settings_pkey;
ALTER TABLE studio_settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE studio_settings ADD PRIMARY KEY (tenant_id, key);


-- ─────────────────────────────────────
-- 6. CREATE INDEXES
-- ─────────────────────────────────────

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_class_types_tenant_id ON class_types(tenant_id);
CREATE INDEX idx_instructors_tenant_id ON instructors(tenant_id);
CREATE INDEX idx_class_schedule_tenant_id ON class_schedule(tenant_id);
CREATE INDEX idx_class_schedule_location_id ON class_schedule(location_id);
CREATE INDEX idx_class_packs_tenant_id ON class_packs(tenant_id);
CREATE INDEX idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX idx_user_credits_tenant_id ON user_credits(tenant_id);
CREATE INDEX idx_waitlist_tenant_id ON waitlist(tenant_id);
CREATE INDEX idx_admin_audit_log_tenant_id ON admin_audit_log(tenant_id);
CREATE INDEX idx_email_log_tenant_id ON email_log(tenant_id);
CREATE INDEX idx_agent_conversations_tenant_id ON agent_conversations(tenant_id);
CREATE INDEX idx_agent_usage_tenant_id ON agent_usage(tenant_id);

-- Composite indexes for common tenant-scoped queries
CREATE INDEX idx_class_schedule_tenant_starts ON class_schedule(tenant_id, starts_at);
CREATE INDEX idx_bookings_tenant_status ON bookings(tenant_id, status);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_user_credits_tenant_status ON user_credits(tenant_id, status);


-- ─────────────────────────────────────
-- 7. UPDATE RLS POLICIES
-- ─────────────────────────────────────

-- Enable RLS on new tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_feature_flags ENABLE ROW LEVEL SECURITY;

-- Public read for reference tables
CREATE POLICY "public_read_plan_limits" ON plan_limits FOR SELECT USING (true);
CREATE POLICY "public_read_feature_flags" ON feature_flags FOR SELECT USING (true);

-- Tenants: public read for resolution, write restricted
CREATE POLICY "public_read_tenants" ON tenants FOR SELECT USING (true);

-- Locations: public read
CREATE POLICY "public_read_locations" ON locations FOR SELECT USING (true);

-- Staff tenants: users can read their own memberships
CREATE POLICY "staff_own_read" ON staff_tenants FOR SELECT USING (auth.uid() = user_id);

-- Tenant feature flags: read by tenant members (via service key in practice)
CREATE POLICY "public_read_tenant_flags" ON tenant_feature_flags FOR SELECT USING (true);

-- Note: In practice, most queries go through supabaseAdmin (service role)
-- which bypasses RLS. These policies are defense-in-depth for any
-- client-side queries that might slip through.

COMMIT;
