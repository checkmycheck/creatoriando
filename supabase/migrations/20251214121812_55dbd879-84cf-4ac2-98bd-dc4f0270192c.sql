-- Remover políticas existentes
DROP POLICY IF EXISTS "Everyone can view theme settings" ON public.theme_settings;
DROP POLICY IF EXISTS "Only admins can modify theme settings" ON public.theme_settings;

-- Criar política para leitura - explicitamente para anon E authenticated
CREATE POLICY "Anyone can read theme settings"
ON public.theme_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Criar política para modificação - apenas admins
CREATE POLICY "Admins can modify theme settings"
ON public.theme_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));