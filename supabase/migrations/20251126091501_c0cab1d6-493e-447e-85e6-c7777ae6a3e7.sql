-- Allow admins to update profiles (credits and subscription plan)
CREATE POLICY "Admins can update user profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));