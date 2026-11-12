import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BADGES } from "@/lib/vibes";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import type { Profile } from "@/hooks/use-kolli-session";
import { RankingControls } from "./RankingControls";

export function AccountDialog({ open, onOpenChange, profile }: { open: boolean; onOpenChange: (o: boolean) => void; profile: Profile | null }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const badges = useQuery({ queryKey: ["my-badges", profile?.id], enabled: open && !!profile, queryFn: async () => ((await supabase.rpc("my_badges")).data ?? {}) as Record<string, number> });

  async function exportData() {
    if (!profile) return;
    const uid = profile.id;
    const [matches, ratings, titleRatings, saved, alerts, given] = await Promise.all([
      supabase.from("matches").select("*").or(`user1.eq.${uid},user2.eq.${uid}`),
      supabase.from("ratings").select("*"),
      supabase.from("title_ratings").select("*").eq("user_id", uid),
      supabase.from("watch_requests").select("*").eq("user_id", uid),
      supabase.from("notifications").select("*").eq("user_id", uid),
      supabase.from("endorsements").select("*").eq("from_user", uid),
    ]);
    const ids = (matches.data ?? []).map((m) => m.id);
    const messages = ids.length ? await supabase.from("messages").select("*").in("match_id", ids) : { data: [] };
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), profile, matches: matches.data, messages: messages.data, ratings: ratings.data, titleRatings: titleRatings.data, savedForLater: saved.data, alerts: alerts.data, endorsementsGiven: given.data, endorsementsReceived: badges.data, browserToken: localStorage.getItem("kolli_device_token") }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kolli-data.json";
    a.click();
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteMyAccount();
      await supabase.auth.signOut();
      toast.success("Your account and Kolli data were deleted.");
      onOpenChange(false);
    } catch {
      toast.error("Could not delete your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setConfirming(false); onOpenChange(o); }}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <p className="text-[10px] font-bold tracking-[0.15em] text-accent">ACCOUNT & PRIVACY</p>
          <DialogTitle className="font-display text-2xl font-bold">{profile?.username}</DialogTitle>
          <DialogDescription>
            {profile?.matches_completed ?? 0} watch parties completed
            {profile && profile.total_ratings_received > 0 ? ` · ★ ${Number(profile.average_rating).toFixed(1)} from ${profile.total_ratings_received}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2" aria-label="Your badges">
          {BADGES.map((b) => <span key={b.id} className="rounded-full border bg-card px-3 py-1 text-xs"><strong>{badges.data?.[b.id] ?? 0}</strong> {b.label}</span>)}
        </div>
        <div className="grid gap-2">
          <Button variant="outline" onClick={exportData}>Download my data</Button>
          <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => onOpenChange(false))}>Sign out</Button>
          {confirming ? (
            <Button variant="destructive" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Yes, permanently delete everything"}</Button>
          ) : (
            <Button variant="ghost" className="text-destructive" onClick={() => setConfirming(true)}>Delete my account</Button>
          )}
        </div>
        {open && profile && <RankingControls userId={profile.id} />}
      </DialogContent>
    </Dialog>
  );
}
