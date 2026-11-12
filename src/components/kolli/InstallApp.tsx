import { useEffect, useState } from "react";
import { Download, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const update = () => setInstalled(display.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const available = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const complete = () => { setInstalled(true); setPrompt(null); setOpen(false); };
    update();
    display.addEventListener("change", update);
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", complete);
    return () => {
      display.removeEventListener("change", update);
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);

  async function install() {
    if (!prompt) { setOpen(true); return; }
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch { setOpen(true); }
    finally { setPrompt(null); }
  }

  if (installed) return null;
  return <>
    <Button variant="ghost" size="sm" onClick={() => void install()} aria-label="Install Kolli" title="Install Kolli">
      <Download /><span className="hidden sm:inline">Install</span>
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Install Kolli</DialogTitle>
          <DialogDescription>Add Kolli to your phone’s home screen.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm">
          <section><h3 className="font-semibold">iPhone · Safari</h3><p className="mt-2 text-muted-foreground">Open kolli.lovable.app in Safari, tap <Share className="inline size-4" aria-label="Share" /> Share, then <PlusSquare className="inline size-4" aria-label="Add" /> Add to Home Screen.</p></section>
          <section><h3 className="font-semibold">Android · Chrome</h3><p className="mt-2 text-muted-foreground">Open kolli.lovable.app in Chrome, tap the ⋮ menu, then Install app or Add to Home screen.</p></section>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}