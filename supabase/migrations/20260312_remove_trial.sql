-- Remove trial_ends_at column — all tenants start on free plan
ALTER TABLE tenants DROP COLUMN IF EXISTS trial_ends_at;
