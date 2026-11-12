import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const result = mode === "register"
        ? await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/admin` } })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setPassword("");
      if (result.error) { setMessage(mode === "register" ? "Could not create the account. Check your email and password or try signing in." : "Sign-in failed. Check your email, password and email confirmation."); return; }
      if (mode === "register" && !result.data.session) setMessage("Check your email and confirm your account before signing in.");
    } finally { setBusy(false); }
  }
  return <section className="border-y py-8">
    <h2 className="font-display text-xl font-bold">{mode === "login" ? "Admin sign-in" : "Create account"}</h2>
    <form onSubmit={submit} className="mt-5 grid max-w-md gap-4">
      <label className="grid gap-2 text-sm">Email<Input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="grid gap-2 text-sm">Password<Input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 12 : 1} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      <Button disabled={busy} type="submit">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</Button>
      <Button variant="outline" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); setPassword(""); }}>{mode === "login" ? "Create an account" : "Already have an account? Sign in"}</Button>
    </form>
  </section>;
}