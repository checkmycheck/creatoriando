-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all credit transactions
CREATE POLICY "Admins can view all credit transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all characters
CREATE POLICY "Admins can view all characters"
ON public.characters
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));