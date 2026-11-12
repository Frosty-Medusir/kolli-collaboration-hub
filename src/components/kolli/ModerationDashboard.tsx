import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Ban, Check, ShieldOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getRankingSettings } from "@/lib/recommendation-admin.functions";
import { getModerationDashboard, setUserBan, resolveConductReport } from "@/lib/moderation.functions";

export function ModerationDashboard({ userId }: { userId: string }) {
  const check = useServerFn(getRankingSettings);
  const read = useServerFn(getModerationDashboard);
  const ban = useServerFn(setUserBan);
  const resolve = useServerFn(resolveConductReport);
  const access = useQuery({ queryKey: ["ranking-settings", userId], queryFn: () => check() });
  const query = useQuery({ queryKey: ["moderation", userId], queryFn: () => read(), enabled: access.data?.isAdmin === true });
  const [target, setTarget] = useState<{ id: string; name: string; banned: boolean } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"open" | "resolved" | "bans">("open");
  if (!access.data?.isAdmin) return null;
  async function applyBan(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setBusy(true);
    try {
      await ban({ data: { userId: target.id, banned: !target.banned, reason } });
      setTarget(null); await query.refetch(); toast.success(target.banned ? "Ban removed" : "User banned");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not change ban"); }
    finally { setBusy(false); }
  }
  async function closeReport(reportId: string) {
    setBusy(true);
    try { await resolve({ data: { reportId } }); await query.refetch(); toast.success("Report resolved"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not resolve report"); }
    finally { setBusy(false); }
  }
  const reports = query.data?.reports.filter((r) => view === "open" ? r.status === "open" : r.status !== "open") ?? [];
  const choose = (id: string, name: string, banned: boolean) => { setTarget({ id, name, banned }); setReason(""); };
  return <section className="border-t py-8">
    <div className="flex items-center justify-between gap-4"><h2 className="font-display text-xl font-bold">Conduct reports</h2><Button size="icon" variant="ghost" aria-label="Refresh reports" onClick={() => void query.refetch()}><RefreshCw className="size-4" /></Button></div>
    <nav className="my-6 flex flex-wrap gap-2" aria-label="Moderation views">
      <Button variant={view === "open" ? "default" : "outline"} onClick={() => setView("open")}>Open reports ({query.data?.reports.filter((r) => r.status === "open").length ?? 0})</Button>
      <Button variant={view === "resolved" ? "default" : "outline"} onClick={() => setView("resolved")}>Resolved</Button>
      <Button variant={view === "bans" ? "default" : "outline"} onClick={() => setView("bans")}>Banned users ({query.data?.bans.length ?? 0})</Button>
    </nav>
    {query.isPending ? <p role="status">Loading reports…</p> : query.isError ? <p role="alert" className="text-destructive">Could not load reports. Try refreshing.</p> : view === "bans" ? <div className="divide-y">{query.data?.bans.length === 0 && <p className="py-6 text-muted-foreground">No banned users.</p>}{query.data?.bans.map((b) => <article key={b.user_id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div className="min-w-0"><h3 className="font-bold break-words">{b.username}</h3><p className="mt-1 text-sm break-words">{b.reason}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(b.banned_at).toLocaleString()}</p></div><Button variant="outline" disabled={busy} onClick={() => choose(b.user_id, b.username, true)}><ShieldOff className="size-4" />Unban</Button></article>)}</div> : <div className="divide-y">{reports.length === 0 && <p className="py-6 text-muted-foreground">No {view} reports.</p>}{reports.map((r) => <article key={r.id} className="py-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-bold break-words">{r.reported_name}{r.banned && <span className="ml-2 text-sm text-destructive">Banned</span>}</h3><p className="mt-1 text-sm text-muted-foreground">Reported by {r.reporter_name} · {new Date(r.created_at).toLocaleString()}</p></div><span className="text-sm capitalize">{r.reason.replaceAll("-", " ")}</span></div>{r.description && <p className="my-4 whitespace-pre-wrap break-words text-sm">{r.description}</p>}<div className="mt-4 flex flex-wrap gap-2"><Button variant={r.banned ? "outline" : "destructive"} disabled={busy} onClick={() => choose(r.reported_user, r.reported_name, r.banned)}><Ban className="size-4" />{r.banned ? "Unban user" : "Ban user"}</Button>{r.status === "open" && <Button variant="outline" disabled={busy} onClick={() => void closeReport(r.id)}><Check className="size-4" />Resolve report</Button>}</div></article>)}</div>}
    <Dialog open={target !== null} onOpenChange={(open) => { if (!open && !busy) setTarget(null); }}><DialogContent><DialogHeader><DialogTitle>{target?.banned ? "Unban" : "Ban"} {target?.name}</DialogTitle></DialogHeader><form className="grid gap-4" onSubmit={applyBan}>{target?.banned ? <p className="text-sm">This account will be able to match and chat again.</p> : <><p className="text-sm">This account will be blocked from matching and chat. Active sessions will end.</p><label className="grid gap-2 text-sm">Ban reason<Input required minLength={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></label></>}<Button type="submit" variant={target?.banned ? "default" : "destructive"} disabled={busy}>{busy ? "Saving…" : target?.banned ? "Confirm unban" : "Confirm ban"}</Button></form></DialogContent></Dialog>
  </section>;
}