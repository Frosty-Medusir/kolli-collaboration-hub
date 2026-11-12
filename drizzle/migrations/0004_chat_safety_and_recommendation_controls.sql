create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, role public.app_role not null, unique(user_id,role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
revoke all on function public.has_role(uuid,public.app_role) from public,anon;
grant execute on function public.has_role(uuid,public.app_role) to authenticated;
create table public.recommendation_settings (id int primary key default 1 check(id=1), taste_weight double precision not null default 2 check(taste_weight between 0 and 5), quality_weight double precision not null default 1 check(quality_weight between 0 and 5), popularity_weight double precision not null default 0.15 check(popularity_weight between 0 and 1), hide_disliked_genres boolean not null default true, updated_at timestamptz not null default now());
grant select,insert,update on public.recommendation_settings to authenticated;
grant all on public.recommendation_settings to service_role;
alter table public.recommendation_settings enable row level security;
create policy "signed in read ranking settings" on public.recommendation_settings for select to authenticated using (auth.uid() is not null);
create policy "admins insert ranking settings" on public.recommendation_settings for insert to authenticated with check(public.has_role(auth.uid(),'admin'));
create policy "admins update ranking settings" on public.recommendation_settings for update to authenticated using(public.has_role(auth.uid(),'admin')) with check(public.has_role(auth.uid(),'admin'));
create function public.chat_content_violation(p_body text) returns text language plpgsql immutable set search_path = public as $$
declare clean text; compact text;
begin
  clean := lower(regexp_replace(coalesce(p_body,''), '[​‌‍﻿]', '', 'g'));
  clean := translate(clean,'013457@$','oieastass');
  compact := regexp_replace(clean,'[^a-z]','','g');
  if clean ~ '\m(fuck|fucking|fucker|motherfucker|bitch|bastard|cunt|nigger|nigga|faggot|retard)\M' or compact ~ '(fuckyou|fuckyour|motherfucker|killyourself|killurself|iwillkillyou|imgoingtokillyou|youareworthless|youreworthless|godie|kys)' then
    return 'Harassment or abusive language is not allowed.';
  end if;
  if clean ~ '(.)\1{11,}' or clean ~ '(\m[a-z]{2,}\M)([[:space:][:punct:]]+\1){5,}' or (select count(*) from regexp_matches(clean,'https?://|www\.','g')) > 3 then
    return 'Repeated text or too many links: please avoid spam.';
  end if;
  return null;
end $$;
revoke all on function public.chat_content_violation(text) from public,anon;
grant execute on function public.chat_content_violation(text) to authenticated;
create index messages_sender_time on public.messages(sender_id,created_at);
create function public.enforce_chat_safety() returns trigger language plpgsql security definer set search_path = public as $$
declare violation text; recent_count int;
begin
  if auth.uid() is null or new.sender_id <> auth.uid() then raise exception 'Sign in to send messages.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.sender_id::text, 0));
  if not exists(select 1 from public.matches where id=new.match_id and auth.uid() in(user1,user2) and status='active' and expires_at > now()) then raise exception 'Chat closed or access denied.'; end if;
  new.body := btrim(new.body);
  violation := public.chat_content_violation(new.body);
  if violation is not null then raise exception '%', violation; end if;
  if exists(select 1 from public.messages where sender_id=new.sender_id and lower(regexp_replace(body,'[[:space:][:punct:]]','','g'))=lower(regexp_replace(new.body,'[[:space:][:punct:]]','','g')) and created_at > now()-interval '30 seconds') then raise exception 'Duplicate message: wait before repeating it.'; end if;
  select count(*) into recent_count from public.messages where sender_id=new.sender_id and created_at > now()-interval '10 seconds';
  if recent_count >= 5 then raise exception 'Too many messages: wait a few seconds.'; end if;
  new.created_at := now();
  return new;
end $$;
revoke all on function public.enforce_chat_safety() from public,anon,authenticated;
create trigger enforce_chat_safety before insert on public.messages for each row execute function public.enforce_chat_safety();