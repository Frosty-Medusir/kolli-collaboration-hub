import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const REASONS = [["inappropriate-behavior", "Inappropriate behavior"], ["harassment", "Harassment"], ["spam", "Spam"], ["fake-profile", "Fake profile"], ["other", "Other"]] as const;

export function ConductReport({ matchId, partnerName }: { matchId: string; partnerName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("inappropriate-behavior");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !REASONS.some(([v]) => v === reason) || details.length > 1000) return;
    setBusy(true); setError("");
    const result = await supabase.rpc("report_conduct", { p_match: matchId, p_reason: reason, p_description: details.trim() });
    setBusy(false);
    if (result.error) return setError(result.error.message.startsWith("Your recent report") ? result.error.message : "Could not send your report. Please try again.");
    setSent(true);
  }
  return <>
    <Button variant="outline" size="sm" onClick={() => { setOpen(true); setError(""); }}><Flag className="size-4" />Report conduct</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Report {partnerName}</DialogTitle><DialogDescription>Behavioral conduct report</DialogDescription></DialogHeader>
        {sent ? <div><p role="status">Your report was received.</p><Button className="mt-4" onClick={() => setOpen(false)}>Close report</Button></div> : <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-2 text-sm">Reason<select aria-label="Report reason" value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-md border bg-background p-2">{REASONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
          <Textarea aria-label="Report details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder="What happened? (optional)" />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send report"}</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </>;
}