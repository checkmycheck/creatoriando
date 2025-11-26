-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create theme_settings table for global colors
CREATE TABLE public.theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read theme settings
CREATE POLICY "Everyone can view theme settings"
  ON public.theme_settings
  FOR SELECT
  USING (true);

-- Only admins can modify theme settings
CREATE POLICY "Only admins can modify theme settings"
  ON public.theme_settings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default theme values
INSERT INTO public.theme_settings (setting_key, setting_value) VALUES
  ('background', '0 0% 4%'),
  ('foreground', '0 0% 95%'),
  ('primary', '75 100% 50%'),
  ('primary-foreground', '0 0% 5%'),
  ('card', '0 0% 10%'),
  ('card-foreground', '0 0% 95%'),
  ('muted', '0 0% 20%'),
  ('muted-foreground', '0 0% 60%'),
  ('lime', '75 100% 50%'),
  ('progress-bar', '75 100% 50%');

-- Trigger to update updated_at
CREATE TRIGGER update_theme_settings_updated_at
  BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Set the admin user (olucaspm@gmail.com)
-- This will be executed after the user signs up
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'olucaspm@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Regular users get 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to assign roles on user creation
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_on_signup();