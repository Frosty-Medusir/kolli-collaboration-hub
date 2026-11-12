import { Link } from "@tanstack/react-router";
import logo from "@/assets/kolli-logo.png";

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link to="/" aria-label="Kolli home" className="inline-flex items-center gap-2 font-display font-extrabold tracking-tighter">
      <img src={logo} alt="" className={small ? "size-7 rounded-full object-cover" : "size-8 rounded-full object-cover"} />
      <span className={small ? "text-xl" : "text-2xl"}>
        kolli<span className="text-accent">.</span>
      </span>
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-4 bg-ink-panel px-[7%] py-8 text-ink-panel-foreground sm:flex-row">
      <Brand small />
      <p className="font-serif italic text-ink-panel-foreground/70">Good movies are better together.</p>
      <span className="text-[10px] tracking-widest text-ink-panel-foreground/60">
        <Link to="/privacy" className="underline underline-offset-4">PRIVACY</Link> · © 2026 Kodovoz Labs
      </span>
    </footer>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold tracking-[0.18em] text-accent">
      <span className="h-px w-8 bg-accent" /> {children}
    </div>
  );
}
