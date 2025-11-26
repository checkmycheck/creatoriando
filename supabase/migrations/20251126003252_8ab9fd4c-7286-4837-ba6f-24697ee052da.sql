-- Inserir role de admin para o usuário existente olucaspm@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'olucaspm@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;