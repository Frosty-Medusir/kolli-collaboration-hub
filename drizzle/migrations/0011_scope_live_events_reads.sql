drop policy "anyone reads live events" on public.live_events;
create policy "public reads upcoming live events" on public.live_events for select to anon, authenticated using (ends_at > now());
create policy "admins read all live events" on public.live_events for select to authenticated using (public.has_role(auth.uid(), 'admin'));
revoke select on public.live_events from anon, authenticated;
grant select (id, title, category, description, poster_url, starts_at, ends_at, created_at) on public.live_events to anon, authenticated;