ALTER POLICY "profiles readable by signed-in" ON public.profiles USING (id = auth.uid());
CREATE FUNCTION public.match_partner_name(p_match uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.username
  FROM public.matches m
  JOIN public.profiles p ON p.id = CASE WHEN m.user1 = auth.uid() THEN m.user2 ELSE m.user1 END
  WHERE m.id = p_match AND auth.uid() IN (m.user1, m.user2);
$$;
REVOKE ALL ON FUNCTION public.match_partner_name(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_partner_name(uuid) TO authenticated;
COMMENT ON FUNCTION public.match_partner_name(uuid) IS 'Returns only the display name of the verified caller''s partner for a specific match. Other profile fields remain owner-only.';