-- Adicionar cores faltantes ao theme_settings
INSERT INTO public.theme_settings (setting_key, setting_value)
VALUES 
  ('card-hover', '0 0% 15%'),
  ('card-selected', '75 100% 50%'),
  ('card-selected-bg', '75 100% 12%'),
  ('secondary', '0 0% 15%'),
  ('secondary-foreground', '0 0% 90%'),
  ('accent', '75 100% 50%'),
  ('accent-foreground', '0 0% 5%'),
  ('lime-foreground', '0 0% 5%'),
  ('border', '0 0% 20%'),
  ('input', '0 0% 20%'),
  ('ring', '75 100% 50%'),
  ('popover', '0 0% 8%'),
  ('popover-foreground', '0 0% 95%'),
  ('destructive', '0 84% 60%'),
  ('destructive-foreground', '0 0% 98%')
ON CONFLICT (setting_key) DO NOTHING;