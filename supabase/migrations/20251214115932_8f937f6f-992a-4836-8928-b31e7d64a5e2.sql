-- Remover políticas antigas (RESTRICTIVE)
DROP POLICY IF EXISTS "Everyone can view theme settings" ON public.theme_settings;
DROP POLICY IF EXISTS "Only admins can modify theme settings" ON public.theme_settings;

-- Criar política PERMISSIVA para leitura (todos podem ler)
CREATE POLICY "Everyone can view theme settings"
ON public.theme_settings
FOR SELECT
TO public
USING (true);

-- Criar política PERMISSIVA para modificação (apenas admins)
CREATE POLICY "Only admins can modify theme settings"
ON public.theme_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));