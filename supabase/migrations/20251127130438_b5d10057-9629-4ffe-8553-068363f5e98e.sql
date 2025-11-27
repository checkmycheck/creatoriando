-- Atualizar função deduct_character_credit para bloquear criação sem créditos
-- e gastar créditos para TODOS os planos (não apenas free)
CREATE OR REPLACE FUNCTION public.deduct_character_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  available_credits INTEGER;
BEGIN
  -- Get user's credits
  SELECT credits INTO available_credits
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- BLOQUEAR se não tiver créditos
  IF available_credits IS NULL OR available_credits <= 0 THEN
    RAISE EXCEPTION 'Créditos insuficientes para criar personagem. Compre mais créditos para continuar.';
  END IF;
  
  -- Deduct one credit (para TODOS os planos)
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
  
  RETURN NEW;
END;
$$;

-- Atualizar função can_create_character para verificar apenas créditos
-- Remover lógica de planos e limite de personagens
CREATE OR REPLACE FUNCTION public.can_create_character(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  available_credits INTEGER;
BEGIN
  -- Get user's credits
  SELECT credits INTO available_credits
  FROM public.profiles
  WHERE id = user_id;
  
  -- Usuário pode criar apenas se tiver créditos disponíveis
  RETURN (available_credits IS NOT NULL AND available_credits > 0);
END;
$$;