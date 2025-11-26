-- Insert sidebar theme settings if they don't exist
INSERT INTO public.theme_settings (setting_key, setting_value)
VALUES 
  ('sidebar', '0 0% 10%'),
  ('sidebar-foreground', '0 0% 95%'),
  ('sidebar-border', '0 0% 20%')
ON CONFLICT (setting_key) DO NOTHING;