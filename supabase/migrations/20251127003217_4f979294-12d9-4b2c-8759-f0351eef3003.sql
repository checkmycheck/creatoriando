-- Add theme_mode column to theme_settings table to support dark/light mode colors
ALTER TABLE public.theme_settings 
ADD COLUMN theme_mode TEXT NOT NULL DEFAULT 'dark' CHECK (theme_mode IN ('dark', 'light'));

-- Create unique constraint to prevent duplicate setting_key for same theme_mode
ALTER TABLE public.theme_settings
DROP CONSTRAINT IF EXISTS theme_settings_setting_key_key;

ALTER TABLE public.theme_settings
ADD CONSTRAINT theme_settings_setting_key_theme_mode_key UNIQUE (setting_key, theme_mode);

-- Duplicate existing settings for light mode (keep dark as is)
INSERT INTO public.theme_settings (setting_key, setting_value, theme_mode)
SELECT setting_key, setting_value, 'light'
FROM public.theme_settings
WHERE theme_mode = 'dark'
ON CONFLICT (setting_key, theme_mode) DO NOTHING;