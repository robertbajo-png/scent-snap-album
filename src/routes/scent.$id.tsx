import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Star, Trash2, Loader2, Sparkles, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { NotePyramid } from "@/components/NotePyramid";
import { AccordBars } from "@/components/AccordBars";
import { MeterRow } from "@/components/MeterRow";
import { ReactionPicker } from "@/components/ReactionPicker";
import { intensityLabel, formatRelative } from "@/lib/perfume";
import type { Reaction, ScanRow } from "@/lib/types";

export const Route = createFileRoute("/scent/$id")({
  component: ScentDetail,
});

function ScentDetail() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [bottleSize, setBottleSize] = useState("");
  const [savingSize, setSavingSize] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data, error } = await supabase.from("scans").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        toast.error(t("scent.not_found"));
        navigate({ to: "/history" });
        return;
      }
      setScan(data as any);
      setNotes((data as any).user_notes ?? "");
      setBottleSize((data as any).bottle_size ?? "");
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, authLoading, navigate]);

  const setReaction = async (next: Reaction) => {
    if (!scan) return;
    setScan({ ...scan, reaction: next, is_favorite: next === "like" || next === "want" });
    await supabase
      .from("scans")
      .update({ reaction: next, is_favorite: next === "like" || next === "want" })
      .eq("id", scan.id);
  };

  const setRating = async (r: number) => {
    if (!scan) return;
    setScan({ ...scan, user_rating: r });
    await supabase.from("scans").update({ user_rating: r }).eq("id", scan.id);
  };

  const saveNotes = async () => {
    if (!scan) return;
    setSavingNotes(true);
    await supabase.from("scans").update({ user_notes: notes }).eq("id", scan.id);
    setSavingNotes(false);
    toast.success(t("scent.note_saved"));
  };

  const toggleOwned = async (next: boolean) => {
    if (!scan) return;
    setScan({ ...scan, owned: next });
    await supabase.from("scans").update({ owned: next }).eq("id", scan.id);
    toast.success(next ? t("owned.added") : t("owned.removed"));
  };

  const saveSize = async () => {
    if (!scan) return;
    setSavingSize(true);
    const trimmed = bottleSize.trim() || null;
    await supabase.from("scans").update({ bottle_size: trimmed }).eq("id", scan.id);
    setScan({ ...scan, bottle_size: trimmed });
    setSavingSize(false);
    toast.success(t("owned.size_saved"));
  };

  const remove = async () => {
    if (!scan) return;
    if (!confirm(t("scent.delete_confirm"))) return;
    await supabase.from("scans").delete().eq("id", scan.id);
    toast.success(t("scent.deleted"));
    navigate({ to: "/history" });
  };

  if (loading || !scan) {
    return (
      <AppShell>
        <div className="grid h-[60vh] place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </AppShell>
    );
  }

  const plainLabel = lang === "en" ? "In plain English" : t("scent.plain_label");

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <Link
          to="/history"
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/60 backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("scent.confidence", { n: Math.round((scan.confidence ?? 0) * 100) })}
        </span>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-3xl border border-border shadow-elegant">
        {scan.image_url ? (
          <img
            src={scan.image_url}
            alt={`${scan.brand} ${scan.name}`}
            className="aspect-[4/5] w-full object-cover"
          />
        ) : (
          <div className="grid aspect-[4/5] w-full place-items-center bg-gradient-luxe text-6xl font-display text-primary-foreground">
            {scan.brand?.[0]}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-veil" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">{scan.brand}</p>
          <h1 className="mt-1 font-display text-3xl leading-tight">{scan.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] opacity-90">
            {scan.gender && <span>{scan.gender}</span>}
            {scan.year && <span>· {scan.year}</span>}
            {scan.perfumer && <span>· {scan.perfumer}</span>}
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
        {t("scent.scanned", { when: formatRelative(scan.created_at, lang) })}
      </p>

      <section className="mt-5">
        <ReactionPicker value={scan.reaction ?? null} onChange={setReaction} />
      </section>

      <section className="mt-5 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gold" strokeWidth={1.7} />
            <div>
              <p className="text-sm font-medium">{t("owned.toggle_label")}</p>
              <p className="text-[11px] text-muted-foreground">
                {scan.owned ? t("owned.toggle_on_desc") : t("owned.toggle_off_desc")}
              </p>
            </div>
          </div>
          <Switch checked={scan.owned} onCheckedChange={toggleOwned} />
        </div>
        {scan.owned && (
          <div className="mt-3 border-t border-border/60 pt-3">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("owned.size_label")}
            </label>
            <div className="mt-1.5 flex gap-2">
              <Input
                value={bottleSize}
                onChange={(e) => setBottleSize(e.target.value)}
                placeholder={t("owned.size_placeholder")}
                className="h-10 rounded-xl border-border bg-background/60"
                maxLength={60}
              />
              <Button
                onClick={saveSize}
                disabled={savingSize || (bottleSize.trim() === (scan.bottle_size ?? "").trim())}
                className="h-10 rounded-xl bg-gradient-luxe px-4 text-sm text-primary-foreground"
              >
                {savingSize ? <Loader2 className="h-4 w-4 animate-spin" /> : t("owned.size_save")}
              </Button>
            </div>
          </div>
        )}
      </section>

      {scan.plain_description && (
        <div className="mt-5 rounded-2xl border border-gold/30 bg-gold/5 p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gold">{plainLabel}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{scan.plain_description}</p>
        </div>
      )}

      {scan.description && (
        <p className="mt-5 text-foreground/90 leading-relaxed">{scan.description}</p>
      )}

      <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("scent.your_rating")}</p>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={t("scent.stars", { n })}>
              <Star
                className={
                  "h-7 w-7 transition " +
                  (scan.user_rating && n <= scan.user_rating ? "fill-gold text-gold" : "text-muted-foreground")
                }
              />
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-2xl">{t("scent.pyramid")}</h2>
        <div className="mt-3">
          <NotePyramid top={scan.top_notes} heart={scan.heart_notes} base={scan.base_notes} />
        </div>
      </section>

      <section className="mt-6 space-y-4 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
        <h2 className="font-display text-2xl">{t("scent.character")}</h2>
        <MeterRow label={t("scent.longevity")} value={scan.longevity ?? 0} hint={intensityLabel(scan.longevity ?? 0, 5, lang)} />
        <MeterRow label={t("scent.sillage")} value={scan.sillage ?? 0} hint={intensityLabel(scan.sillage ?? 0, 5, lang)} />
      </section>

      {scan.accords?.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
          <h2 className="font-display text-2xl">{t("scent.accords")}</h2>
          <div className="mt-4">
            <AccordBars accords={scan.accords as any} />
          </div>
        </section>
      )}

      {(scan.occasions?.length || scan.seasons?.length) && (
        <section className="mt-6 grid grid-cols-2 gap-3">
          {[
            { title: t("scent.occasions"), items: scan.occasions },
            { title: t("scent.seasons"), items: scan.seasons },
          ].map((col) => (
            <div key={col.title} className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{col.title}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {col.items?.map((s) => (
                  <span key={s} className="rounded-full bg-accent px-2 py-0.5 text-[11px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {Array.isArray(scan.similar_perfumes) && scan.similar_perfumes.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="font-display text-2xl">{t("scent.similar")}</h2>
          </div>
          <div className="mt-3 space-y-2">
            {(scan.similar_perfumes as any[]).map((s, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.brand}</p>
                <p className="font-display text-lg">{s.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.why}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-display text-2xl">{t("scent.note")}</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("scent.note_placeholder")}
          className="mt-3 min-h-[100px] rounded-2xl border-border bg-card/60 backdrop-blur"
        />
        <Button
          onClick={saveNotes}
          disabled={savingNotes}
          className="mt-3 h-11 w-full rounded-2xl bg-gradient-luxe text-primary-foreground shadow-soft hover:opacity-90"
        >
          {savingNotes ? t("common.saving") : t("scent.note_save")}
        </Button>
      </section>

      <Button
        variant="ghost"
        onClick={remove}
        className="mt-6 h-11 w-full rounded-2xl text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {t("scent.delete")}
      </Button>
    </AppShell>
  );
}
