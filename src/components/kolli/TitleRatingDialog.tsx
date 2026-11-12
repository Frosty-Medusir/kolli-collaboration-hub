import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { rateTitle } from "@/lib/catalog.functions";
import type { Title } from "@/lib/titles";

export function TitleRatingDialog({ title, current, onClose, onSaved }: { title: Title | null; current: number; onClose: () => void; onSaved: () => void }) {
  const save = useServerFn(rateTitle);
  const [busy, setBusy] = useState(false);
  async function rate(stars: number) {
    if (!title || busy) return;
    setBusy(true);
    try { await save({ data: { id: title.id, type: title.type, stars } }); toast.success("Your rating saved"); onSaved(); onClose(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not save rating"); }
    finally { setBusy(false); }
  }
  return <Dialog open={!!title} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="bg-background">
      <DialogHeader><DialogTitle>{title?.title}</DialogTitle><DialogDescription>Your rating · {current ? `${current}/5` : "Not rated yet"}</DialogDescription></DialogHeader>
      <div className="flex gap-2" role="group" aria-label="Your title rating">
        {[1, 2, 3, 4, 5].map((n) => <Button key={n} variant="ghost" size="icon" aria-label={`Rate ${n} stars`} disabled={busy} onClick={() => rate(n)}><Star className={n <= current ? "size-7 fill-star text-star" : "size-7 text-muted-foreground"} /></Button>)}
      </div>
    </DialogContent>
  </Dialog>;
}