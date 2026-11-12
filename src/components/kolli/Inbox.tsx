import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function Inbox({ userId }: { userId: string }) {
  const client = useQueryClient();
  const inbox = useQuery({
    queryKey: ["inbox", userId],
    refetchInterval: 20000,
    queryFn: async () => {
      const [n, r] = await Promise.all([
        supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
        supabase.from("watch_requests").select("*").eq("user_id", userId).eq("status", "waiting").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
      ]);
      return { notes: n.data ?? [], saved: r.data ?? [] };
    },
  });
  const unread = (inbox.data?.notes ?? []).filter((n) => !n.read_at).length;
  async function onOpen(o: boolean) {
    if (o && unread) { await supabase.rpc("mark_notifications_read"); void client.invalidateQueries({ queryKey: ["inbox"] }); }
  }
  async function cancel(id: string) {
    await supabase.rpc("cancel_watch_request", { p_request: id });
    void client.invalidateQueries({ queryKey: ["inbox"] });
  }
  return (
    <Popover onOpenChange={onOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Alerts, ${unread} new` : "Alerts"}>
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 bg-background">
        <h3 className="font-display text-sm font-bold">Alerts</h3>
        {(inbox.data?.notes ?? []).length === 0 && <p className="mt-2 text-xs text-muted-foreground">No alerts yet. Save a title for later and we'll tell you here when someone matches.</p>}
        <ul className="mt-2 grid gap-2">
          {(inbox.data?.notes ?? []).slice(0, 5).map((n) => (
            <li key={n.id} className="rounded border bg-card p-2 text-xs">
              <strong className="block">{n.title}</strong>
              <span className="text-muted-foreground">{n.body}</span>
              {n.match_id && <Link to="/lobby/$matchId" params={{ matchId: n.match_id }} className="mt-1 block font-semibold text-accent">Open lobby ↗</Link>}
            </li>
          ))}
        </ul>
        {(inbox.data?.saved ?? []).length > 0 && <>
          <h3 className="mt-4 font-display text-sm font-bold">Saved for later</h3>
          <ul className="mt-2 grid gap-1">
            {inbox.data!.saved.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate">{r.content_title}<span className="block text-muted-foreground">until {new Date(r.expires_at).toLocaleDateString()}</span></span>
                <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => cancel(r.id)}>Cancel</Button>
              </li>
            ))}
          </ul>
        </>}
      </PopoverContent>
    </Popover>
  );
}
