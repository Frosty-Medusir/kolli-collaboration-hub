import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SlidersHorizontal, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { getRankingSettings, saveRankingSettings } from "@/lib/recommendation-admin.functions";
import { recommendationSettingsSchema, type RecommendationSettings } from "@/lib/recommendation-settings";
import { Link } from "@tanstack/react-router";

export function RankingControls({ userId, page = false }: { userId: string; page?: boolean }) {
  const read = useServerFn(getRankingSettings);
  const save = useServerFn(saveRankingSettings);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["ranking-settings", userId], queryFn: () => read() });
  const [draft, setDraft] = useState<RecommendationSettings | null>(null);
  const [busy, setBusy] = useState(false);
  if (query.isPending) return page ? <p className="py-8 text-muted-foreground" role="status">Checking admin access…</p> : null;
  if (query.isError) return page ? <div className="py-8"><p role="alert" className="text-destructive">Could not check admin access.</p><Button className="mt-4" variant="outline" onClick={() => void query.refetch()}>Try again</Button></div> : null;
  if (!query.data?.isAdmin) return page ? <div className="border-y py-8"><h2 className="font-display text-xl font-bold">Admin access required</h2><p className="mt-2 text-sm text-muted-foreground">This account does not have permission to change recommendation settings.</p></div> : null;
  if (!page) return <Button asChild variant="outline"><Link to="/admin"><SlidersHorizontal className="size-4" />Admin page</Link></Button>;
  const settings = draft ?? query.data.settings;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = recommendationSettingsSchema.safeParse(settings);
    if (!parsed.success) return void toast.error("Check the recommendation weights");
    setBusy(true);
    try {
      await save({ data: parsed.data });
      await Promise.all([client.invalidateQueries({ queryKey: ["ranking-settings"] }), client.invalidateQueries({ queryKey: ["recommendations"] })]);
      setDraft(null);
      toast.success("Recommendation settings saved");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save settings"); }
    finally { setBusy(false); }
  }
  return <section className="border-y py-8">
    <h2 className="flex items-center gap-2 font-display text-xl font-bold"><SlidersHorizontal className="size-5 text-accent" />Recommendation settings</h2>
    <form onSubmit={submit} className="mt-6 grid max-w-xl gap-6">
      {([ ["taste_weight", "Personal taste", 5], ["quality_weight", "TMDB quality", 5], ["popularity_weight", "Popularity", 1] ] as const).map(([key, label, max]) => <label key={key} className="flex items-center justify-between gap-3 text-sm">
        {label}<Input aria-label={label} type="number" min={0} max={max} step={0.05} value={settings[key]} onChange={(e) => setDraft({ ...settings, [key]: e.target.valueAsNumber })} className="w-24" />
      </label>)}
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={settings.hide_disliked_genres} onCheckedChange={(checked) => setDraft({ ...settings, hide_disliked_genres: checked === true })} />Hide negatively rated genres</label>
      <Button type="submit" disabled={busy}><Save className="size-4" />{busy ? "Saving…" : "Save settings"}</Button>
      <Button type="button" variant="outline" disabled={busy} onClick={() => setDraft(null)}>Discard changes</Button>
    </form>
  </section>;
}