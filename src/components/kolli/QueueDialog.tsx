import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Title } from "@/lib/titles";
import { VIBES, toggleVibe, type Vibe } from "@/lib/vibes";
import { cn } from "@/lib/utils";

type Phase = "choose" | "joining" | "waiting" | "saved" | "error";

export function QueueDialog({ title, onClose }: { title: Title | null; onClose: () => void }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [phase, setPhase] = useState<Phase>("choose");
  const [error, setError] = useState("");
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (title) { setPhase("choose"); setError(""); }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [title]);

  function args(t: Title) {
    return { p_content_id: t.id, p_title: t.title, p_type: t.type, p_poster: t.poster || "", p_year: Number(t.year) || 0, p_vibes: vibes };
  }

  async function matchNow() {
    if (!title) return;
    setPhase("joining");
    const { data, error } = await supabase.rpc("find_match", args(title));
    if (error) { setError(error.message); setPhase("error"); return; }
    const res = data as { status: string; matchId?: string };
    if (res.status === "matched" && res.matchId) return void navigate({ to: "/lobby/$matchId", params: { matchId: res.matchId } });
    setPhase("waiting");
    timer.current = setInterval(async () => {
      const { data: s } = await supabase.rpc("queue_status");
      const st = s as { status: string; matchId?: string } | null;
      if (st?.status === "matched" && st.matchId) {
        clearInterval(timer.current);
        toast.success("Match found!");
        navigate({ to: "/lobby/$matchId", params: { matchId: st.matchId } });
      } else if (st?.status === "none") {
        clearInterval(timer.current);
        setError("Nobody joined within 5 minutes. Save it for later and we'll alert you when someone picks it.");
        setPhase("error");
      }
    }, 3000);
  }

  async function saveForLater() {
    if (!title) return;
    if (timer.current) clearInterval(timer.current);
    setPhase("joining");
    const { data, error } = await supabase.rpc("queue_for_later", args(title));
    if (error) { setError(error.message); setPhase("error"); return; }
    const res = data as { status: string; matchId?: string };
    void client.invalidateQueries({ queryKey: ["inbox"] });
    if (res.status === "matched" && res.matchId) { toast.success("Someone saved it too — match found!"); return void navigate({ to: "/lobby/$matchId", params: { matchId: res.matchId } }); }
    setPhase("saved");
  }

  async function cancel() {
    if (timer.current) clearInterval(timer.current);
    if (phase === "waiting" || phase === "joining") await supabase.rpc("leave_queue");
    onClose();
  }

  const heading = { choose: "How do you like to watch?", joining: "Looking for someone…", waiting: "Looking for someone…", saved: "Saved for later", error: "No match this time" }[phase];
  const desc = {
    choose: "Pick any that fit. We only pair you with people whose style doesn't clash.",
    joining: "One moment…",
    waiting: "We'll pair you with the next person who picks the same title. Keep this open.",
    saved: "We'll keep looking for 7 days and alert you here in Kolli when a compatible match picks it.",
    error,
  }[phase];

  return (
    <Dialog open={!!title} onOpenChange={(o) => !o && cancel()}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <p className="text-[10px] font-bold tracking-[0.15em] text-accent">FINDING YOUR MATCH</p>
          <DialogTitle className="font-display text-2xl font-bold">{heading}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        {title && (
          <div className="flex items-center gap-3 rounded-md border bg-card p-3">
            {title.poster && <img src={title.poster} alt="" className="h-16 w-11 rounded object-cover" />}
            <div>
              <strong className="block font-display text-sm">{title.title}</strong>
              <small className="text-muted-foreground">{title.type === "event" ? "Live event" : `${title.year} · ${title.type === "tv" ? "TV show" : "Movie"}`}</small>
            </div>
          </div>
        )}
        {phase === "choose" && (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Viewing style">
              {VIBES.map((v) => (
                <button key={v.id} type="button" aria-pressed={vibes.includes(v.id)} onClick={() => setVibes((c) => toggleVibe(c, v.id))}
                  className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", vibes.includes(v.id) ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground")}>{v.label}</button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={matchNow}>Match now ↗</Button>
              <Button variant="outline" onClick={saveForLater}>Save for later this week</Button>
            </div>
          </>
        )}
        {(phase === "joining" || phase === "waiting") && <div className="size-9 animate-spin rounded-full border-[3px] border-border border-t-accent" />}
        {phase === "waiting" && <Button variant="outline" onClick={saveForLater}>Save for later instead</Button>}
        {phase === "error" && !/banned|paused|up to 5/.test(error) && <Button onClick={saveForLater}>Save for later this week</Button>}
        <Button variant="ghost" onClick={cancel}>{phase === "waiting" ? "Stop looking" : "Close"}</Button>
      </DialogContent>
    </Dialog>
  );
}
