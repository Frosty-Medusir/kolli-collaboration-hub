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

export function RankingControls({ userId }: { userId: string }) {
  const read = useServerFn(getRankingSettings);
  const save = useServerFn(saveRankingSettings);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["ranking-settings", userId], queryFn: () => read() });
  const [draft, setDraft] = useState<RecommendationSettings | null>(null);
  const [busy, setBusy] = useState(false);
  if (!query.data?.isAdmin) return null;
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
  return <details className="border-t pt-3">
    <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="size-4" />Recommendation settings</summary>
    <form onSubmit={submit} className="mt-3 grid gap-3">
      {([ ["taste_weight", "Personal taste", 5], ["quality_weight", "TMDB quality", 5], ["popularity_weight", "Popularity", 1] ] as const).map(([key, label, max]) => <label key={key} className="flex items-center justify-between gap-3 text-sm">
        {label}<Input aria-label={label} type="number" min={0} max={max} step={0.05} value={settings[key]} onChange={(e) => setDraft({ ...settings, [key]: e.target.valueAsNumber })} className="w-24" />
      </label>)}
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={settings.hide_disliked_genres} onCheckedChange={(checked) => setDraft({ ...settings, hide_disliked_genres: checked === true })} />Hide negatively rated genres</label>
      <Button type="submit" disabled={busy}><Save className="size-4" />{busy ? "Saving…" : "Save settings"}</Button>
    </form>
  </details>;
}