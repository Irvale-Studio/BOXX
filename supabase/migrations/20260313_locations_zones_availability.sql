-- ─────────────────────────────────────
-- Migration: Multi-location, Zones, Instructor Availability
-- Date: 2026-03-13
-- ─────────────────────────────────────

BEGIN;

-- ─────────────────────────────────────
-- 1. ZONES (areas within a location)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS zones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  capacity    INT,
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_zones_tenant_id ON zones(tenant_id);
CREATE INDEX idx_zones_location_id ON zones(location_id);

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_zones" ON zones FOR SELECT USING (true);

-- ─────────────────────────────────────
-- 2. INSTRUCTOR ↔ LOCATION junction
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS instructor_locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  location_id   UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(instructor_id, location_id)
);

CREATE INDEX idx_instructor_locations_tenant ON instructor_locations(tenant_id);
CREATE INDEX idx_instructor_locations_instructor ON instructor_locations(instructor_id);
CREATE INDEX idx_instructor_locations_location ON instructor_locations(location_id);

ALTER TABLE instructor_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_instructor_locations" ON instructor_locations FOR SELECT USING (true);

-- ─────────────────────────────────────
-- 3. INSTRUCTOR AVAILABILITY (Calendly-style)
-- Weekly recurring windows
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS instructor_availability (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  instructor_id     UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  location_id       UUID REFERENCES locations(id) ON DELETE SET NULL,
  zone_id           UUID REFERENCES zones(id) ON DELETE SET NULL,
  day_of_week       INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sun..6=Sat
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  session_duration  INT NOT NULL DEFAULT 60, -- minutes per slot
  concurrent_slots  INT NOT NULL DEFAULT 1,  -- e.g. 10 masseuses = 10 concurrent
  credits_cost      INT NOT NULL DEFAULT 1,  -- 0 = free
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX idx_instructor_availability_tenant ON instructor_availability(tenant_id);
CREATE INDEX idx_instructor_availability_instructor ON instructor_availability(instructor_id);
CREATE INDEX idx_instructor_availability_day ON instructor_availability(tenant_id, day_of_week);

ALTER TABLE instructor_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_instructor_availability" ON instructor_availability FOR SELECT USING (true);

-- ─────────────────────────────────────
-- 4. INSTRUCTOR UNAVAILABILITY (exceptions/holidays)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS instructor_unavailability (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_instructor_unavailability_tenant ON instructor_unavailability(tenant_id);
CREATE INDEX idx_instructor_unavailability_instructor ON instructor_unavailability(instructor_id);
CREATE INDEX idx_instructor_unavailability_dates ON instructor_unavailability(instructor_id, start_date, end_date);

ALTER TABLE instructor_unavailability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_instructor_unavailability" ON instructor_unavailability FOR SELECT USING (true);

-- ─────────────────────────────────────
-- 5. ALTER class_schedule: add zone_id, allow NULL capacity, allow credits_cost=0
-- ─────────────────────────────────────

-- Add zone_id FK
ALTER TABLE class_schedule ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_class_schedule_zone_id ON class_schedule(zone_id);

-- Allow NULL capacity (= unlimited)
-- capacity already has DEFAULT 6 and is INT, just need to ensure it allows NULL
-- It already allows NULL (no NOT NULL constraint in schema), but update the default comment:
-- No schema change needed — capacity is already nullable.

-- credits_cost already defaults to 1 and allows 0 (INT with no CHECK > 0)
-- No schema change needed — just allow 0 in the API validation.

-- Add is_appointment flag to class_schedule (marks classes created via availability booking)
ALTER TABLE class_schedule ADD COLUMN IF NOT EXISTS is_appointment BOOLEAN DEFAULT false;

-- Add availability_id to link appointment bookings back to the availability window
ALTER TABLE class_schedule ADD COLUMN IF NOT EXISTS availability_id UUID REFERENCES instructor_availability(id) ON DELETE SET NULL;

-- ─────────────────────────────────────
-- 6. NEW FEATURE FLAGS
-- ─────────────────────────────────────
INSERT INTO feature_flags (key, description, default_enabled, enabled_for_plans)
VALUES
  ('zones', 'Zones/areas within locations', false, '{growth,pro,enterprise}')
ON CONFLICT (key) DO NOTHING;

-- appointment_booking, multi_location, instructor_availability already exist from initial seed

-- ─────────────────────────────────────
-- 7. UPDATE plan_limits: add max_zones
-- ─────────────────────────────────────
ALTER TABLE plan_limits ADD COLUMN IF NOT EXISTS max_zones INT NOT NULL DEFAULT 0;

UPDATE plan_limits SET max_zones = 0 WHERE plan = 'free';
UPDATE plan_limits SET max_zones = 5 WHERE plan = 'starter';
UPDATE plan_limits SET max_zones = 20 WHERE plan = 'growth';
UPDATE plan_limits SET max_zones = 50 WHERE plan = 'pro';
UPDATE plan_limits SET max_zones = 9999 WHERE plan = 'enterprise';

COMMIT;
