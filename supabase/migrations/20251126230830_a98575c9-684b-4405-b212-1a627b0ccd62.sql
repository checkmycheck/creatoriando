-- Update referral bonus from 5 to 3 credits
-- Update the apply_referral_bonus function
CREATE OR REPLACE FUNCTION public.apply_referral_bonus(referral_code_param text, new_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ref_code_record RECORD;
  bonus_amount INTEGER := 3;
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
$function$;

-- Update default bonus_credits value in referral_codes table
ALTER TABLE public.referral_codes 
ALTER COLUMN bonus_credits SET DEFAULT 3;