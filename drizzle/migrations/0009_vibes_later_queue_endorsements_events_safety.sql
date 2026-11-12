-- Vibes + event content types
ALTER TABLE public.queue_entries DROP CONSTRAINT IF EXISTS queue_entries_content_type_check;
ALTER TABLE public.queue_entries ADD CONSTRAINT queue_entries_content_type_check CHECK (content_type IN ('movie','tv','event'));
ALTER TABLE public.queue_entries ADD COLUMN vibes text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.matches ADD COLUMN icebreaker text;
ALTER TABLE public.matches ADD COLUMN teleparty_url text;

CREATE OR REPLACE FUNCTION public.clean_vibes(p text[]) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(array_agg(DISTINCT v ORDER BY v), '{}') FROM unnest(coalesce(p,'{}')) v WHERE v IN ('chatty','silent','mic_on','text_only')
$$;
CREATE OR REPLACE FUNCTION public.vibes_compatible(a text[], b text[]) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT NOT (('chatty' = ANY(a) AND 'silent' = ANY(b)) OR ('silent' = ANY(a) AND 'chatty' = ANY(b))
           OR ('mic_on' = ANY(a) AND 'text_only' = ANY(b)) OR ('text_only' = ANY(a) AND 'mic_on' = ANY(b)))
$$;

-- Live events (admin-curated)
CREATE TABLE public.live_events (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  category text NOT NULL CHECK (category IN ('sports','esports','reality')),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  poster_url text CHECK (poster_url IS NULL OR poster_url ~ '^https://'),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
GRANT SELECT ON public.live_events TO anon, authenticated;
GRANT INSERT, DELETE ON public.live_events TO authenticated;
GRANT ALL ON public.live_events TO service_role;
ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads live events" ON public.live_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins add live events" ON public.live_events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND created_by = auth.uid());
CREATE POLICY "admins remove live events" ON public.live_events FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Watch-later requests
CREATE TABLE public.watch_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_id integer NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('movie','tv','event')),
  content_title text NOT NULL,
  poster_url text,
  release_year integer,
  vibes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','matched','cancelled')),
  match_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days'
);
CREATE INDEX ON public.watch_requests (content_id, content_type, status, created_at);
GRANT SELECT ON public.watch_requests TO authenticated;
GRANT ALL ON public.watch_requests TO service_role;
ALTER TABLE public.watch_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own watch requests" ON public.watch_requests FOR SELECT TO authenticated USING (user_id = auth.uid());

-- In-app notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  match_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.notifications (user_id, created_at DESC);
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Positive-only endorsements
CREATE TABLE public.endorsements (
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  badge text NOT NULL CHECK (badge IN ('great_chat','good_vibes','movie_buff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (from_user, match_id, badge)
);
CREATE INDEX ON public.endorsements (to_user);
GRANT SELECT ON public.endorsements TO authenticated;
GRANT ALL ON public.endorsements TO service_role;
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own given endorsements" ON public.endorsements FOR SELECT TO authenticated USING (from_user = auth.uid());

-- Security: guest IP log (24h) and device tokens (server-only)
CREATE TABLE public.guest_session_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text NOT NULL,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.guest_session_log (created_at);
GRANT SELECT ON public.guest_session_log TO authenticated;
GRANT ALL ON public.guest_session_log TO service_role;
ALTER TABLE public.guest_session_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read guest log" ON public.guest_session_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.device_tokens (
  token_hash text NOT NULL,
  user_id uuid NOT NULL,
  flagged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (token_hash, user_id)
);
GRANT ALL ON public.device_tokens TO service_role;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.shadow_flags (
  user_id uuid PRIMARY KEY,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.shadow_flags TO service_role;
ALTER TABLE public.shadow_flags ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.flag_devices_on_ban() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN UPDATE public.device_tokens SET flagged = true WHERE user_id = NEW.user_id; RETURN NEW; END $$;
CREATE TRIGGER flag_devices_on_ban AFTER INSERT OR UPDATE ON public.moderation_bans FOR EACH ROW EXECUTE FUNCTION public.flag_devices_on_ban();

-- Helpers
CREATE OR REPLACE FUNCTION public.endorsement_total(p_user uuid) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT count(*)::int FROM public.endorsements WHERE to_user = p_user
$$;
REVOKE ALL ON FUNCTION public.endorsement_total(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_user(p_user uuid, p_title text, p_body text, p_match uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  INSERT INTO public.notifications(user_id, title, body, match_id) VALUES (p_user, p_title, p_body, p_match)
$$;
REVOKE ALL ON FUNCTION public.notify_user(uuid,text,text,uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.resolve_content(INOUT p_content_id int, INOUT p_title text, INOUT p_type text, INOUT p_poster text, INOUT p_year int) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE ev public.live_events;
BEGIN
  IF p_type NOT IN ('movie','tv','event') THEN p_type := 'movie'; END IF;
  IF p_type = 'event' THEN
    SELECT * INTO ev FROM public.live_events WHERE id = p_content_id AND ends_at > now();
    IF ev.id IS NULL THEN RAISE EXCEPTION 'This live event is over or no longer listed'; END IF;
    p_title := ev.title; p_poster := ev.poster_url; p_year := extract(year FROM ev.starts_at)::int;
  END IF;
  p_title := left(coalesce(p_title,'Untitled'), 200);
END $$;
REVOKE ALL ON FUNCTION public.resolve_content(int,text,text,text,int) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.matching_guard(me uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE prof public.profiles;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  SELECT * INTO prof FROM public.profiles WHERE id = me;
  IF prof.id IS NULL THEN RAISE EXCEPTION 'Profile missing'; END IF;
  IF EXISTS (SELECT 1 FROM public.moderation_bans WHERE user_id = me) THEN RAISE EXCEPTION 'This account is banned from matching and chat.'; END IF;
  IF prof.shadow_banned_until IS NOT NULL AND prof.shadow_banned_until > now() THEN
    RAISE EXCEPTION 'You are temporarily paused from matching after several low ratings. Please try again later.';
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.shadow_flags WHERE user_id = me);
END $$;
REVOKE ALL ON FUNCTION public.matching_guard(uuid) FROM PUBLIC, anon, authenticated;

-- Live matching with vibes and watch-later pickup
CREATE OR REPLACE FUNCTION public.find_match(p_content_id int, p_title text, p_type text, p_poster text, p_year int, p_vibes text[])
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE me uuid := auth.uid(); shadowed boolean; v text[] := public.clean_vibes(p_vibes);
  other public.queue_entries; req public.watch_requests; new_match uuid; my_name text;
BEGIN
  shadowed := public.matching_guard(me);
  SELECT * INTO p_content_id, p_title, p_type, p_poster, p_year FROM public.resolve_content(p_content_id, p_title, p_type, p_poster, p_year);
  UPDATE queue_entries SET status='expired' WHERE user_id=me AND status='waiting';
  IF NOT shadowed THEN
    SELECT q.* INTO other FROM queue_entries q
     WHERE q.content_id=p_content_id AND q.content_type=p_type AND q.user_id<>me AND q.status='waiting'
       AND q.joined_at >= now() - interval '5 minutes' AND public.vibes_compatible(q.vibes, v)
       AND NOT EXISTS (SELECT 1 FROM shadow_flags s WHERE s.user_id=q.user_id)
     ORDER BY public.endorsement_total(q.user_id) DESC, q.joined_at LIMIT 1 FOR UPDATE OF q SKIP LOCKED;
    IF other.id IS NOT NULL THEN
      UPDATE queue_entries SET status='matched', matched_with=me WHERE id=other.id;
      INSERT INTO queue_entries(user_id,content_id,content_title,content_type,poster_url,release_year,status,matched_with,vibes)
        VALUES (me,p_content_id,p_title,p_type,p_poster,p_year,'matched',other.user_id,v);
      INSERT INTO matches(content_id,content_title,content_type,poster_url,release_year,user1,user2)
        VALUES (p_content_id,p_title,p_type,p_poster,p_year,me,other.user_id) RETURNING id INTO new_match;
      RETURN json_build_object('status','matched','matchId',new_match);
    END IF;
    SELECT w.* INTO req FROM watch_requests w
     WHERE w.content_id=p_content_id AND w.content_type=p_type AND w.user_id<>me AND w.status='waiting'
       AND w.expires_at > now() AND public.vibes_compatible(w.vibes, v)
       AND NOT EXISTS (SELECT 1 FROM shadow_flags s WHERE s.user_id=w.user_id)
       AND NOT EXISTS (SELECT 1 FROM moderation_bans b WHERE b.user_id=w.user_id)
     ORDER BY public.endorsement_total(w.user_id) DESC, w.created_at LIMIT 1 FOR UPDATE OF w SKIP LOCKED;
    IF req.id IS NOT NULL THEN
      INSERT INTO matches(content_id,content_title,content_type,poster_url,release_year,user1,user2)
        VALUES (p_content_id,p_title,p_type,p_poster,p_year,me,req.user_id) RETURNING id INTO new_match;
      UPDATE watch_requests SET status='matched', match_id=new_match WHERE id=req.id;
      INSERT INTO queue_entries(user_id,content_id,content_title,content_type,poster_url,release_year,status,matched_with,vibes)
        VALUES (me,p_content_id,p_title,p_type,p_poster,p_year,'matched',req.user_id,v);
      SELECT username INTO my_name FROM profiles WHERE id=me;
      PERFORM public.notify_user(req.user_id, 'Match found for ' || p_title, coalesce(my_name,'Someone') || ' wants to watch it with you. Your lobby is open for 8 hours.', new_match);
      RETURN json_build_object('status','matched','matchId',new_match);
    END IF;
  END IF;
  INSERT INTO queue_entries(user_id,content_id,content_title,content_type,poster_url,release_year,vibes)
    VALUES (me,p_content_id,p_title,p_type,p_poster,p_year,v);
  RETURN json_build_object('status','queued');
END $$;

CREATE OR REPLACE FUNCTION public.queue_for_later(p_content_id int, p_title text, p_type text, p_poster text, p_year int, p_vibes text[])
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE me uuid := auth.uid(); shadowed boolean; v text[] := public.clean_vibes(p_vibes);
  req public.watch_requests; new_match uuid; my_name text; other_name text; expires timestamptz;
BEGIN
  shadowed := public.matching_guard(me);
  SELECT * INTO p_content_id, p_title, p_type, p_poster, p_year FROM public.resolve_content(p_content_id, p_title, p_type, p_poster, p_year);
  PERFORM pg_advisory_xact_lock(hashtextextended(me::text, 77));
  UPDATE queue_entries SET status='expired' WHERE user_id=me AND status='waiting';
  UPDATE watch_requests SET status='cancelled' WHERE user_id=me AND status='waiting' AND content_id=p_content_id AND content_type=p_type;
  IF (SELECT count(*) FROM watch_requests WHERE user_id=me AND status='waiting' AND expires_at > now()) >= 5 THEN
    RAISE EXCEPTION 'You can save up to 5 titles for later. Cancel one first.';
  END IF;
  IF NOT shadowed THEN
    SELECT w.* INTO req FROM watch_requests w
     WHERE w.content_id=p_content_id AND w.content_type=p_type AND w.user_id<>me AND w.status='waiting'
       AND w.expires_at > now() AND public.vibes_compatible(w.vibes, v)
       AND NOT EXISTS (SELECT 1 FROM shadow_flags s WHERE s.user_id=w.user_id)
       AND NOT EXISTS (SELECT 1 FROM moderation_bans b WHERE b.user_id=w.user_id)
     ORDER BY public.endorsement_total(w.user_id) DESC, w.created_at LIMIT 1 FOR UPDATE OF w SKIP LOCKED;
    IF req.id IS NOT NULL THEN
      INSERT INTO matches(content_id,content_title,content_type,poster_url,release_year,user1,user2)
        VALUES (p_content_id,p_title,p_type,p_poster,p_year,me,req.user_id) RETURNING id INTO new_match;
      UPDATE watch_requests SET status='matched', match_id=new_match WHERE id=req.id;
      SELECT username INTO my_name FROM profiles WHERE id=me;
      SELECT username INTO other_name FROM profiles WHERE id=req.user_id;
      PERFORM public.notify_user(req.user_id, 'Match found for ' || p_title, coalesce(my_name,'Someone') || ' wants to watch it with you. Your lobby is open for 8 hours.', new_match);
      PERFORM public.notify_user(me, 'Match found for ' || p_title, coalesce(other_name,'Someone') || ' saved it too. Your lobby is open for 8 hours.', new_match);
      RETURN json_build_object('status','matched','matchId',new_match);
    END IF;
  END IF;
  INSERT INTO watch_requests(user_id,content_id,content_type,content_title,poster_url,release_year,vibes)
    VALUES (me,p_content_id,p_type,p_title,p_poster,p_year,v) RETURNING expires_at INTO expires;
  RETURN json_build_object('status','saved','expiresAt',expires);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_watch_request(p_request uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.watch_requests SET status='cancelled' WHERE id=p_request AND user_id=auth.uid() AND status='waiting'
$$;
CREATE OR REPLACE FUNCTION public.mark_notifications_read() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.notifications SET read_at=now() WHERE user_id=auth.uid() AND read_at IS NULL
$$;

CREATE OR REPLACE FUNCTION public.endorse_partner(p_match uuid, p_badges text[]) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.matches; partner uuid; n int;
BEGIN
  SELECT * INTO m FROM matches WHERE id=p_match AND auth.uid() IN (user1,user2);
  IF m.id IS NULL THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF m.status = 'active' THEN RAISE EXCEPTION 'Finish the watch party first'; END IF;
  partner := CASE WHEN m.user1=auth.uid() THEN m.user2 ELSE m.user1 END;
  INSERT INTO endorsements(from_user,to_user,match_id,badge)
    SELECT auth.uid(), partner, p_match, b FROM unnest(coalesce(p_badges,'{}')) b WHERE b IN ('great_chat','good_vibes','movie_buff')
    ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.badge_counts(p_user uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object(
    'great_chat', count(*) FILTER (WHERE badge='great_chat'),
    'good_vibes', count(*) FILTER (WHERE badge='good_vibes'),
    'movie_buff', count(*) FILTER (WHERE badge='movie_buff'))
  FROM public.endorsements WHERE to_user=p_user
$$;
REVOKE ALL ON FUNCTION public.badge_counts(uuid) FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.my_badges() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.badge_counts(auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.match_partner_badges(p_match uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE m public.matches;
BEGIN
  SELECT * INTO m FROM matches WHERE id=p_match AND auth.uid() IN (user1,user2);
  IF m.id IS NULL THEN RETURN NULL; END IF;
  RETURN public.badge_counts(CASE WHEN m.user1=auth.uid() THEN m.user2 ELSE m.user1 END);
END $$;

CREATE OR REPLACE FUNCTION public.set_teleparty_link(p_match uuid, p_url text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u text := btrim(coalesce(p_url,'')); host text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM matches WHERE id=p_match AND auth.uid() IN (user1,user2) AND status='active') THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF u = '' THEN UPDATE matches SET teleparty_url=NULL WHERE id=p_match; RETURN NULL; END IF;
  IF char_length(u) > 500 OR u !~ '^https://' THEN RAISE EXCEPTION 'Teleparty link must be an HTTPS link on teleparty.com'; END IF;
  host := lower(substring(u FROM '^https://([^/:?#]+)'));
  IF host IS NULL OR NOT (host = 'teleparty.com' OR host LIKE '%.teleparty.com') THEN RAISE EXCEPTION 'Teleparty link must be an HTTPS link on teleparty.com'; END IF;
  UPDATE matches SET teleparty_url=u WHERE id=p_match;
  RETURN u;
END $$;

REVOKE ALL ON FUNCTION public.find_match(int,text,text,text,int,text[]), public.queue_for_later(int,text,text,text,int,text[]), public.cancel_watch_request(uuid), public.mark_notifications_read(), public.endorse_partner(uuid,text[]), public.my_badges(), public.match_partner_badges(uuid), public.set_teleparty_link(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_match(int,text,text,text,int,text[]), public.queue_for_later(int,text,text,text,int,text[]), public.cancel_watch_request(uuid), public.mark_notifications_read(), public.endorse_partner(uuid,text[]), public.my_badges(), public.match_partner_badges(uuid), public.set_teleparty_link(uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION public.clean_vibes(text[]), public.vibes_compatible(text[],text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clean_vibes(text[]), public.vibes_compatible(text[],text[]) TO authenticated;
-- Old entry point now forwards to find_match without vibes so older clients cannot bypass event checks
CREATE OR REPLACE FUNCTION public.join_queue(p_content_id int, p_title text, p_type text, p_poster text, p_year int)
RETURNS json LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT public.find_match(p_content_id,p_title,p_type,p_poster,p_year,'{}') $$;