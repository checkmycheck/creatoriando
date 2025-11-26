-- Create enum for subscription plans
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'enterprise');

-- Add subscription columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN subscription_plan public.subscription_plan NOT NULL DEFAULT 'free',
ADD COLUMN subscription_status TEXT DEFAULT 'active',
ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Create function to count user characters
CREATE OR REPLACE FUNCTION public.get_user_character_count(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.characters
  WHERE characters.user_id = get_user_character_count.user_id
$$;

-- Create function to check if user can create more characters
CREATE OR REPLACE FUNCTION public.can_create_character(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan public.subscription_plan;
  character_count INTEGER;
BEGIN
  -- Get user's subscription plan
  SELECT subscription_plan INTO user_plan
  FROM public.profiles
  WHERE id = user_id;
  
  -- Get character count
  SELECT public.get_user_character_count(user_id) INTO character_count;
  
  -- Check limits based on plan
  IF user_plan = 'free' THEN
    RETURN character_count < 1;
  ELSE
    -- Pro and enterprise have unlimited
    RETURN TRUE;
  END IF;
END;
$$;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.subscription_plan IS 'User subscription plan: free (1 character limit), pro (unlimited), or enterprise (unlimited + extras)';
COMMENT ON FUNCTION public.get_user_character_count IS 'Returns the total number of characters created by a user';
COMMENT ON FUNCTION public.can_create_character IS 'Checks if user can create more characters based on their plan limits';