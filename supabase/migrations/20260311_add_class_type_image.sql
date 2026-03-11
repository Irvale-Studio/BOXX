-- Add image_url to class_types for uploadable event images
ALTER TABLE class_types ADD COLUMN IF NOT EXISTS image_url TEXT;
