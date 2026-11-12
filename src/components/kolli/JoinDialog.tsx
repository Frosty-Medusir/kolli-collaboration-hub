import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { DISPLAY_NAME_RE } from "@/lib/titles";

export function JoinDialog({ open, onOpenChange, onJoined }: { open: boolean; onOpenChange: (o: boolean) => void; onJoined: () => void }) {
  const [name, setName] = useState("");
  const [adult, setAdult] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const username = name.trim();
    if (!DISPLAY_NAME_RE.test(username)) return void toast.error("Choose a display name with 3–24 letters, numbers, spaces, hyphens, or underscores.");
    if (!adult || !privacy) return void toast.error("Confirm that you are 18 or older and accept the privacy notice to continue.");
    setBusy(true);
    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        session = data.session;
      }
      const { error } = await supabase.from("profiles").insert({ id: session!.user.id, username });
      if (error && error.code !== "23505") throw error;
      toast.success(`Welcome, ${username}!`);
      onJoined();
      onOpenChange(false);
    } catch {
      toast.error("Could not start a guest session. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <p className="text-[10px] font-bold tracking-[0.15em] text-accent">JOIN AS A GUEST</p>
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">Pick a display name</DialogTitle>
          <DialogDescription>Your match will see this name. No sign-up needed.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Popcorn Pal" maxLength={24} aria-label="Display name" className="bg-card" />
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <Checkbox checked={adult} onCheckedChange={(v) => setAdult(v === true)} className="mt-0.5" /> I confirm I am 18 or older.
          </label>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <Checkbox checked={privacy} onCheckedChange={(v) => setPrivacy(v === true)} className="mt-0.5" />
            <span>I have read and accept the <Link to="/privacy" className="underline" target="_blank">privacy notice</Link>.</span>
          </label>
          <Button type="submit" disabled={busy} className="mt-2">{busy ? "Joining…" : "Start watching"} ↗</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
