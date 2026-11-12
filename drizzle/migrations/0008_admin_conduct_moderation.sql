CREATE TABLE public.moderation_bans (user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, reason text NOT NULL, banned_by uuid NOT NULL, banned_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.moderation_bans TO authenticated;
GRANT ALL ON public.moderation_bans TO service_role;
ALTER TABLE public.moderation_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin or own ban" ON public.moderation_bans FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
ALTER TABLE public.reports ADD COLUMN resolved_at timestamptz, ADD COLUMN resolved_by uuid;
CREATE OR REPLACE FUNCTION public.admin_moderation_dashboard() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 RETURN jsonb_build_object('reports',coalesce((SELECT jsonb_agg(row_to_json(r)) FROM (SELECT r.id,r.reported_user,r.reason,r.description,r.status,r.created_at,r.resolved_at,coalesce(p.username,'Deleted account') AS reported_name,coalesce(reporter.username,'Deleted account') AS reporter_name,b.user_id IS NOT NULL AS banned FROM public.reports r LEFT JOIN public.profiles p ON p.id=r.reported_user LEFT JOIN public.profiles reporter ON reporter.id=r.reported_by LEFT JOIN public.moderation_bans b ON b.user_id=r.reported_user ORDER BY r.created_at DESC LIMIT 200) r),'[]'::jsonb),'bans',coalesce((SELECT jsonb_agg(row_to_json(b)) FROM (SELECT b.user_id,b.reason,b.banned_at,p.username FROM public.moderation_bans b JOIN public.profiles p ON p.id=b.user_id ORDER BY b.banned_at DESC LIMIT 200) b),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.admin_moderation_dashboard() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_moderation_dashboard() TO authenticated;
CREATE OR REPLACE FUNCTION public.admin_set_user_ban(p_user uuid,p_banned boolean,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF p_user IS NULL OR p_banned IS NULL THEN RAISE EXCEPTION 'Select a user and action'; END IF;
 IF p_user=auth.uid() OR public.has_role(p_user,'admin') THEN RAISE EXCEPTION 'Administrator accounts cannot be banned here'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user) THEN RAISE EXCEPTION 'User no longer exists'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,42));
 IF p_banned THEN
  IF char_length(btrim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 500 THEN RAISE EXCEPTION 'Enter a ban reason between 3 and 500 characters'; END IF;
  INSERT INTO public.moderation_bans(user_id,reason,banned_by) VALUES(p_user,btrim(p_reason),auth.uid()) ON CONFLICT(user_id) DO UPDATE SET reason=excluded.reason,banned_by=excluded.banned_by,banned_at=now();
  UPDATE public.queue_entries SET status='expired' WHERE user_id=p_user AND status='waiting';
  UPDATE public.matches SET status='ended',ended_at=now() WHERE p_user IN(user1,user2) AND status='active';
 ELSE
  DELETE FROM public.moderation_bans WHERE user_id=p_user;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_user_ban(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_ban(uuid,boolean,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.admin_resolve_report(p_report uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 UPDATE public.reports SET status='resolved',resolved_at=now(),resolved_by=auth.uid() WHERE id=p_report AND status='open';
 IF NOT FOUND THEN RAISE EXCEPTION 'Report no longer open'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.admin_resolve_report(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_report(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.enforce_moderation_ban() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ids uuid[]; target uuid;
BEGIN
 IF TG_TABLE_NAME='queue_entries' THEN ids:=ARRAY[NEW.user_id];
 ELSIF TG_TABLE_NAME='messages' THEN ids:=ARRAY[NEW.sender_id];
 ELSE ids:=ARRAY[NEW.user1,NEW.user2]; END IF;
 FOR target IN SELECT unnest(ids) ORDER BY 1 LOOP
  PERFORM pg_advisory_xact_lock(hashtextextended(target::text,42));
  IF EXISTS(SELECT 1 FROM public.moderation_bans WHERE user_id=target) THEN RAISE EXCEPTION 'This account is banned from matching and chat.'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER moderation_queue_guard BEFORE INSERT OR UPDATE ON public.queue_entries FOR EACH ROW WHEN (NEW.status IN ('waiting','matched')) EXECUTE FUNCTION public.enforce_moderation_ban();
CREATE TRIGGER moderation_message_guard BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.enforce_moderation_ban();
CREATE TRIGGER moderation_match_guard BEFORE INSERT ON public.matches FOR EACH ROW EXECUTE FUNCTION public.enforce_moderation_ban();