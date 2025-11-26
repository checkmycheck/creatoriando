-- Add CPF column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.cpf IS 'Brazilian CPF (Cadastro de Pessoas Físicas) - Tax ID';