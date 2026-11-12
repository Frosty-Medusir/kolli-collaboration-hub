import { useEffect, useState } from "react";
import logo from "@/assets/kolli-logo.png";

export function LoadingScreen({ leaving = false, onFinished }: { leaving?: boolean; onFinished?: () => void }) {
  return (
    <div className={`kolli-loading fixed inset-0 z-[100] grid min-h-dvh place-items-center bg-background px-6 ${leaving ? "kolli-loading-leaving" : ""}`} role="status" aria-label="Loading Kolli" onAnimationEnd={(event) => {
      if (leaving && event.target === event.currentTarget) onFinished?.();
    }}>
      <div className="flex flex-col items-center">
        <div className="kolli-loading-mark relative grid size-28 place-items-center">
          <span className="kolli-loading-ring absolute inset-0 rounded-full border-2 border-border border-t-accent" aria-hidden="true" />
          <img src={logo} alt="" className="size-20 rounded-full object-cover" />
        </div>
        <p className="mt-6 font-display text-4xl font-extrabold">kolli<span className="text-accent">.</span></p>
        <p className="mt-3 font-serif italic text-muted-foreground">Good movies are better together.</p>
        <div className="mt-8 flex h-2 items-center gap-2" aria-hidden="true">
          <span className="kolli-loading-dot size-1.5 rounded-full bg-accent" />
          <span className="kolli-loading-dot size-1.5 rounded-full bg-accent" />
          <span className="kolli-loading-dot size-1.5 rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}

export function StartupScreen() {
  const [leaving, setLeaving] = useState(false);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    const loaded = () => setLeaving(true);
    if (document.readyState === "complete") loaded();
    else window.addEventListener("load", loaded, { once: true });
    return () => window.removeEventListener("load", loaded);
  }, []);
  return finished ? null : <LoadingScreen leaving={leaving} onFinished={() => setFinished(true)} />;
}