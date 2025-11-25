-- Add missing columns to characters table
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS appearance TEXT,
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS lighting TEXT;