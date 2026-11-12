CREATE TABLE public.owner_admin_emails (email text PRIMARY KEY CHECK (email = lower(email)));
GRANT ALL ON public.owner_admin_emails TO service_role;
REVOKE ALL ON public.owner_admin_emails FROM anon, authenticated;
ALTER TABLE public.owner_admin_emails ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.assign_verified_owner_admin() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF new.email_confirmed_at IS NOT NULL AND new.is_anonymous IS NOT TRUE
     AND EXISTS (SELECT 1 FROM public.owner_admin_emails o WHERE o.email = lower(new.email)) THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (new.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN new;
END $$;
REVOKE ALL ON FUNCTION public.assign_verified_owner_admin() FROM public, anon, authenticated;