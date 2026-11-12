import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Title } from "@/lib/titles";

export function QueueDialog({ title, onClose }: { title: Title | null; onClose: () => void }) {
  const navigate = useNavigate();
  const [state, setState] = useState<"joining" | "waiting" | "error">("joining");
  const [error, setError] = useState("");
  const started = useRef<number | null>(null);

  useEffect(() => {
    if (!title) return;
    if (started.current === title.id) return;
    started.current = title.id;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    setState("joining");
    (async () => {
      const { data, error } = await supabase.rpc("join_queue", {
        p_content_id: title.id, p_title: title.title, p_type: title.type, p_poster: title.poster, p_year: Number(title.year),
      });
      if (cancelled) return;
      if (error) { setError(error.message); setState("error"); return; }
      const res = data as { status: string; matchId?: string };
      if (res.status === "matched" && res.matchId) return navigate({ to: "/lobby/$matchId", params: { matchId: res.matchId } });
      setState("waiting");
      timer = setInterval(async () => {
        const { data: s } = await supabase.rpc("queue_status");
        const st = s as { status: string; matchId?: string } | null;
        if (st?.status === "matched" && st.matchId) {
          clearInterval(timer);
          toast.success("Match found!");
          navigate({ to: "/lobby/$matchId", params: { matchId: st.matchId } });
        } else if (st?.status === "none") {
          clearInterval(timer);
          setError("Nobody joined within 5 minutes. Try again or pick another title.");
          setState("error");
        }
      }, 3000);
    })();
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [title, navigate]);

  async function cancel() {
    started.current = null;
    await supabase.rpc("leave_queue");
    onClose();
  }

  return (
    <Dialog open={!!title} onOpenChange={(o) => !o && cancel()}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <p className="text-[10px] font-bold tracking-[0.15em] text-accent">FINDING YOUR MATCH</p>
          <DialogTitle className="font-display text-2xl font-bold">{state === "error" ? "No match this time" : "Looking for someone…"}</DialogTitle>
          <DialogDescription>{state === "error" ? error : "We'll pair you with the next person who picks the same title. Keep this open."}</DialogDescription>
        </DialogHeader>
        {state !== "error" && <div className="size-9 animate-spin rounded-full border-[3px] border-border border-t-accent" />}
        {title && (
          <div className="flex items-center gap-3 rounded-md border bg-card p-3">
            <img src={title.poster} alt="" className="h-16 w-11 rounded object-cover" />
            <div>
              <strong className="block font-display text-sm">{title.title}</strong>
              <small className="text-muted-foreground">{title.year} · {title.type === "tv" ? "TV show" : "Movie"}</small>
            </div>
          </div>
        )}
        <Button variant="outline" onClick={cancel}>{state === "error" ? "Close" : "Stop looking"}</Button>
      </DialogContent>
    </Dialog>
  );
}
