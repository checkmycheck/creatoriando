-- Add credits column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0;

-- Create credit_transactions table for tracking all credit movements
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'referral_bonus', 'usage', 'refund')),
  description TEXT,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  payment_id TEXT,
  payment_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  uses INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral_uses table to track who used which code
CREATE TABLE IF NOT EXISTS public.referral_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referrer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits_awarded INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referral_code_id, referred_user_id)
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_uses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own credit transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit transactions"
ON public.credit_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral codes"
ON public.referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes"
ON public.referral_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view referral codes by code"
ON public.referral_codes FOR SELECT
USING (true);

-- RLS Policies for referral_uses
CREATE POLICY "Users can view referral uses where they are involved"
ON public.referral_uses FOR SELECT
USING (auth.uid() = referred_user_id OR auth.uid() = referrer_user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Function to handle referral bonus
CREATE OR REPLACE FUNCTION public.apply_referral_bonus(
  referral_code_param TEXT,
  new_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code_record RECORD;
  bonus_amount INTEGER := 5;
BEGIN
  -- Get referral code details
  SELECT * INTO ref_code_record
  FROM public.referral_codes
  WHERE code = referral_code_param;
  
  -- Check if code exists
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user already used a referral code
  IF EXISTS(SELECT 1 FROM public.referral_uses WHERE referred_user_id = new_user_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is not referring themselves
  IF ref_code_record.user_id = new_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Award bonus to referrer
  UPDATE public.profiles
  SET credits = credits + bonus_amount
  WHERE id = ref_code_record.user_id;
  
  -- Award bonus to new user
  UPDATE public.profiles
  SET credits = credits + bonus_amount
  WHERE id = new_user_id;
  
  -- Increment referral code uses
  UPDATE public.referral_codes
  SET uses = uses + 1
  WHERE id = ref_code_record.id;
  
  -- Record the referral use
  INSERT INTO public.referral_uses (
    referral_code_id,
    referred_user_id,
    referrer_user_id,
    credits_awarded
  ) VALUES (
    ref_code_record.id,
    new_user_id,
    ref_code_record.user_id,
    bonus_amount
  );
  
  -- Log transactions
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES 
    (ref_code_record.user_id, bonus_amount, 'referral_bonus', 'Bônus por indicação de amigo'),
    (new_user_id, bonus_amount, 'referral_bonus', 'Bônus de boas-vindas por indicação');
  
  RETURN TRUE;
END;
$$;

-- Function to deduct credits when creating character
CREATE OR REPLACE FUNCTION public.deduct_character_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan public.subscription_plan;
  available_credits INTEGER;
BEGIN
  -- Get user's subscription plan and credits
  SELECT subscription_plan, credits INTO user_plan, available_credits
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Only deduct credits for free users
  IF user_plan = 'free' THEN
    -- Check if user has credits
    IF available_credits > 0 THEN
      -- Deduct one credit
      UPDATE public.profiles
      SET credits = credits - 1
      WHERE id = NEW.user_id;
      
      -- Log the transaction
      INSERT INTO public.credit_transactions (
        user_id,
        amount,
        type,
        description,
        character_id
      ) VALUES (
        NEW.user_id,
        -1,
        'usage',
        'Crédito usado para criar personagem: ' || NEW.name,
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for character creation
DROP TRIGGER IF EXISTS deduct_credit_on_character_creation ON public.characters;
CREATE TRIGGER deduct_credit_on_character_creation
AFTER INSERT ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.deduct_character_credit();

-- Update can_create_character function to consider credits
CREATE OR REPLACE FUNCTION public.can_create_character(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_plan public.subscription_plan;
  character_count INTEGER;
  available_credits INTEGER;
BEGIN
  -- Get user's subscription plan, character count and credits
  SELECT subscription_plan, credits INTO user_plan, available_credits
  FROM public.profiles
  WHERE id = user_id;
  
  -- Get character count
  SELECT public.get_user_character_count(user_id) INTO character_count;
  
  -- Check limits based on plan
  IF user_plan = 'free' THEN
    -- Free users can create if they haven't reached limit OR have extra credits
    RETURN (character_count < 1) OR (available_credits > 0);
  ELSE
    -- Pro and enterprise have unlimited
    RETURN TRUE;
  END IF;
END;
$function$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);