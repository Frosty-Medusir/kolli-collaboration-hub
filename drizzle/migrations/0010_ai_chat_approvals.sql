create table public.chat_approvals (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null,
  match_id uuid not null,
  body text not null,
  expires_at timestamptz not null default now() + interval '2 minutes'
);
grant all on public.chat_approvals to service_role;
alter table public.chat_approvals enable row level security;
alter table public.messages add column approval_id uuid;

create or replace function public.enforce_chat_safety() returns trigger language plpgsql security definer set search_path = public as $$
declare violation text; recent_count int; ok boolean;
begin
  if auth.uid() is null or new.sender_id <> auth.uid() then raise exception 'Sign in to send messages.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.sender_id::text, 0));
  if not exists(select 1 from public.matches where id=new.match_id and auth.uid() in(user1,user2) and status='active' and expires_at > now()) then raise exception 'Chat closed or access denied.'; end if;
  new.body := btrim(new.body);
  delete from public.chat_approvals where id=new.approval_id and sender_id=new.sender_id and match_id=new.match_id and body=new.body and expires_at > now() returning true into ok;
  if ok is null then raise exception 'Safety check required: message not sent.'; end if;
  delete from public.chat_approvals where expires_at < now();
  violation := public.chat_content_violation(new.body);
  if violation is not null then raise exception '%', violation; end if;
  if exists(select 1 from public.messages where sender_id=new.sender_id and lower(regexp_replace(body,'[[:space:][:punct:]]','','g'))=lower(regexp_replace(new.body,'[[:space:][:punct:]]','','g')) and created_at > now()-interval '30 seconds') then raise exception 'Duplicate message: wait before repeating it.'; end if;
  select count(*) into recent_count from public.messages where sender_id=new.sender_id and created_at > now()-interval '10 seconds';
  if recent_count >= 5 then raise exception 'Too many messages: wait a few seconds.'; end if;
  new.created_at := now();
  return new;
end $$;
revoke all on function public.enforce_chat_safety() from public,anon,authenticated;