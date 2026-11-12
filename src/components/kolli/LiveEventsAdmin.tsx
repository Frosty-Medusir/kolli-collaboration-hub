import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getRankingSettings } from "@/lib/recommendation-admin.functions";

export function LiveEventsAdmin({ userId }: { userId: string }) {
  const check = useServerFn(getRankingSettings);
  const access = useQuery({ queryKey: ["ranking-settings", userId], queryFn: () => check() });
  if (!access.data?.isAdmin) return null;
  return <EventsEditor />;
}

function EventsEditor() {
  const client = useQueryClient();
  const events = useQuery({ queryKey: ["live-events"], queryFn: async () => (await supabase.from("live_events").select("*").order("starts_at")).data ?? [] });
  const [form, setForm] = useState({ title: "", category: "sports", description: "", poster_url: "", starts_at: "", ends_at: "" });
  const [busy, setBusy] = useState(false);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.starts_at || !form.ends_at) return void toast.error("Add a start and end time");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("live_events").insert({
      title: form.title.trim(), category: form.category, description: form.description.trim(), poster_url: form.poster_url.trim() || null,
      starts_at: new Date(form.starts_at).toISOString(), ends_at: new Date(form.ends_at).toISOString(), created_by: u.user!.id,
    });
    setBusy(false);
    if (error) return void toast.error(error.message.includes("check") ? "Check the title (3–120 characters), image link (https) and times" : "Could not add the event");
    toast.success("Live event added");
    setForm({ title: "", category: "sports", description: "", poster_url: "", starts_at: "", ends_at: "" });
    void client.invalidateQueries({ queryKey: ["live-events"] });
  }
  async function remove(id: number) {
    const { error } = await supabase.from("live_events").delete().eq("id", id);
    if (error) return void toast.error("Could not remove the event");
    void client.invalidateQueries({ queryKey: ["live-events"] });
  }
  return (
    <section className="mb-12">
      <h2 className="font-display text-2xl font-bold">Live events</h2>
      <p className="mt-1 text-sm text-muted-foreground">Sports, esports and reality finales people can match on.</p>
      <form onSubmit={add} className="mt-4 grid max-w-xl gap-3">
        <Input aria-label="Event title" placeholder="e.g. Champions League Final" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={3} maxLength={120} className="bg-background" />
        <select aria-label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="sports">Sports</option><option value="esports">Esports</option><option value="reality">Reality TV finale</option>
        </select>
        <Textarea aria-label="Description" placeholder="Short description (shown as the icebreaker)" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-background" />
        <Input aria-label="Image link" placeholder="https://… image (optional)" value={form.poster_url} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} className="bg-background" />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">Starts<Input type="datetime-local" aria-label="Starts" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="mt-1 bg-background" /></label>
          <label className="text-xs font-semibold">Ends<Input type="datetime-local" aria-label="Ends" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="mt-1 bg-background" /></label>
        </div>
        <Button type="submit" disabled={busy}>{busy ? "Adding…" : "Add live event"}</Button>
      </form>
      <ul className="mt-5 grid gap-2">
        {(events.data ?? []).map((ev) => (
          <li key={ev.id} className="flex items-center justify-between gap-3 rounded border bg-card p-3 text-sm">
            <span><strong>{ev.title}</strong><span className="block text-xs text-muted-foreground">{ev.category} · {new Date(ev.starts_at).toLocaleString()}{new Date(ev.ends_at) < new Date() ? " · ended" : ""}</span></span>
            <Button variant="ghost" size="sm" onClick={() => remove(ev.id)}>Remove</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
