
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 3 and 24),
  adult_confirmed_at timestamptz not null default now(),
  privacy_notice_version text not null default '2026-10-16',
  matches_completed int not null default 0,
  average_rating numeric(3,2) not null default 0,
  total_ratings_received int not null default 0,
  bad_ratings int not null default 0,
  shadow_banned_until timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by signed-in" on public.profiles for select to authenticated using (true);
create policy "insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid() and matches_completed = 0 and bad_ratings = 0 and shadow_banned_until is null);

create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content_id int not null,
  content_title text not null,
  content_type text not null default 'movie' check (content_type in ('movie','tv')),
  poster_url text,
  release_year int,
  status text not null default 'waiting' check (status in ('waiting','matched','expired')),
  matched_with uuid,
  joined_at timestamptz not null default now()
);
create index on public.queue_entries (content_id, content_type, status, joined_at);
grant select on public.queue_entries to authenticated;
grant all on public.queue_entries to service_role;
alter table public.queue_entries enable row level security;
create policy "own queue entries" on public.queue_entries for select to authenticated using (user_id = auth.uid());

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  content_id int not null,
  content_title text not null,
  content_type text not null default 'movie',
  poster_url text,
  release_year int,
  kosmi_room_url text,
  user1 uuid not null,
  user2 uuid not null,
  status text not null default 'active' check (status in ('active','ended','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '8 hours',
  ended_at timestamptz
);
grant select on public.matches to authenticated;
grant all on public.matches to service_role;
alter table public.matches enable row level security;
create policy "participants read match" on public.matches for select to authenticated using (auth.uid() in (user1, user2));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null,
  sender_name text not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index on public.messages (match_id, created_at);
grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "participants read messages" on public.messages for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and auth.uid() in (m.user1, m.user2)));
create policy "participants send messages" on public.messages for insert to authenticated
  with check (sender_id = auth.uid()
    and sender_name = (select username from public.profiles where id = auth.uid())
    and exists (select 1 from public.matches m where m.id = match_id and auth.uid() in (m.user1, m.user2) and m.status = 'active'));

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null,
  to_user uuid not null,
  match_id uuid not null references public.matches(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique (from_user, match_id)
);
grant select on public.ratings to authenticated;
grant all on public.ratings to service_role;
alter table public.ratings enable row level security;
create policy "own ratings" on public.ratings for select to authenticated using (from_user = auth.uid());

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reported_user uuid not null,
  reported_by uuid not null,
  match_id uuid references public.matches(id) on delete set null,
  reason text not null check (reason in ('inappropriate-behavior','harassment','spam','fake-profile','other')),
  description text check (char_length(description) <= 1000),
  status text not null default 'open',
  created_at timestamptz not null default now()
);
grant insert on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "file reports" on public.reports for insert to authenticated with check (reported_by = auth.uid() and status = 'open');

-- Matching: join the queue, pairing with the oldest waiting person for the same title (5 min window)
create or replace function public.join_queue(p_content_id int, p_title text, p_type text, p_poster text, p_year int)
returns json language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  prof public.profiles;
  other public.queue_entries;
  new_match uuid;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into prof from profiles where id = me;
  if prof.id is null then raise exception 'Profile missing'; end if;
  if prof.shadow_banned_until is not null and prof.shadow_banned_until > now() then
    raise exception 'You are temporarily paused from matching after several low ratings. Please try again later.';
  end if;
  if p_type not in ('movie','tv') then p_type := 'movie'; end if;

  update queue_entries set status = 'expired' where user_id = me and status = 'waiting';

  select * into other from queue_entries
   where content_id = p_content_id and content_type = p_type and user_id <> me
     and status = 'waiting' and joined_at >= now() - interval '5 minutes'
   order by joined_at limit 1 for update skip locked;

  if other.id is not null then
    update queue_entries set status = 'matched', matched_with = me where id = other.id;
    insert into queue_entries (user_id, content_id, content_title, content_type, poster_url, release_year, status, matched_with)
      values (me, p_content_id, p_title, p_type, p_poster, p_year, 'matched', other.user_id);
    insert into matches (content_id, content_title, content_type, poster_url, release_year, user1, user2)
      values (p_content_id, p_title, p_type, p_poster, p_year, me, other.user_id) returning id into new_match;
    return json_build_object('status','matched','matchId',new_match);
  end if;

  insert into queue_entries (user_id, content_id, content_title, content_type, poster_url, release_year)
    values (me, p_content_id, p_title, p_type, p_poster, p_year);
  return json_build_object('status','queued');
end $$;

create or replace function public.queue_status()
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); m uuid;
begin
  select id into m from matches where auth.uid() in (user1,user2) and status='active' and expires_at > now() order by created_at desc limit 1;
  if m is not null then return json_build_object('status','matched','matchId',m); end if;
  if exists (select 1 from queue_entries where user_id = me and status='waiting' and joined_at >= now() - interval '5 minutes') then
    return json_build_object('status','queued');
  end if;
  return json_build_object('status','none');
end $$;

create or replace function public.leave_queue()
returns void language sql security definer set search_path = public as $$
  update queue_entries set status='expired' where user_id = auth.uid() and status='waiting';
$$;

create or replace function public.set_kosmi_room(p_match uuid, p_url text)
returns text language plpgsql security definer set search_path = public as $$
declare host text;
begin
  if not exists (select 1 from matches where id = p_match and auth.uid() in (user1,user2) and status='active') then
    raise exception 'Access denied';
  end if;
  p_url := nullif(trim(coalesce(p_url,'')),'');
  if p_url is not null then
    host := lower(substring(p_url from '^https://([^/:?#]+)'));
    if host is null or not (host = 'kosmi.io' or host like '%.kosmi.io') then
      raise exception 'Room link must be an HTTPS link hosted on kosmi.io';
    end if;
  end if;
  update matches set kosmi_room_url = p_url where id = p_match;
  return p_url;
end $$;

create or replace function public.end_match(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m matches;
begin
  update matches set status='ended', ended_at = now()
   where id = p_match and auth.uid() in (user1,user2) and status='active' returning * into m;
  if m.id is not null then
    update profiles set matches_completed = matches_completed + 1 where id in (m.user1, m.user2);
  end if;
end $$;

-- Rating: more than 3 ratings of 2 stars or less pauses matching for 24 hours
create or replace function public.rate_partner(p_match uuid, p_stars int, p_comment text)
returns void language plpgsql security definer set search_path = public as $$
declare m matches; partner uuid; tot int; avg_s numeric; bad int;
begin
  select * into m from matches where id = p_match and auth.uid() in (user1,user2) and status='ended';
  if m.id is null then raise exception 'No completed watch party found to rate'; end if;
  if p_stars < 1 or p_stars > 5 then raise exception 'Pick 1 to 5 stars'; end if;
  partner := case when m.user1 = auth.uid() then m.user2 else m.user1 end;
  begin
    insert into ratings (from_user, to_user, match_id, stars, comment) values (auth.uid(), partner, p_match, p_stars, left(p_comment, 500));
  exception when unique_violation then raise exception 'You already rated this watch party';
  end;
  select count(*), avg(stars), count(*) filter (where stars <= 2) into tot, avg_s, bad from ratings where to_user = partner;
  update profiles set total_ratings_received = tot, average_rating = round(avg_s, 2), bad_ratings = bad,
    shadow_banned_until = case when bad > 3 then greatest(coalesce(shadow_banned_until, now()), now() + interval '24 hours') else shadow_banned_until end
   where id = partner;
end $$;

revoke execute on function public.join_queue, public.queue_status, public.leave_queue, public.set_kosmi_room, public.end_match, public.rate_partner from public, anon;
grant execute on function public.join_queue, public.queue_status, public.leave_queue, public.set_kosmi_room, public.end_match, public.rate_partner to authenticated;

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;
