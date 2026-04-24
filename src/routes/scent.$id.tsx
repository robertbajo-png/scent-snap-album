import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Star, Trash2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
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
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data, error } = await supabase.from("scans").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        toast.error("Kunde inte hitta scanningen");
        navigate({ to: "/history" });
        return;
      }
      setScan(data as any);
      setNotes((data as any).user_notes ?? "");
      setLoading(false);
    })();
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
    toast.success("Anteckning sparad");
  };

  const remove = async () => {
    if (!scan) return;
    if (!confirm("Ta bort denna scanning?")) return;
    await supabase.from("scans").delete().eq("id", scan.id);
    toast.success("Borttagen");
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
          Säkerhet {Math.round((scan.confidence ?? 0) * 100)}%
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
        Scannad {formatRelative(scan.created_at)}
      </p>

      {/* Reaction picker */}
      <section className="mt-5">
        <ReactionPicker value={scan.reaction ?? null} onChange={setReaction} />
      </section>

      {scan.plain_description && (
        <div className="mt-5 rounded-2xl border border-gold/30 bg-gold/5 p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gold">På vanlig svenska</p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{scan.plain_description}</p>
        </div>
      )}

      {scan.description && (
        <p className="mt-5 text-foreground/90 leading-relaxed">{scan.description}</p>
      )}

      {/* Rating */}
      <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Ditt betyg</p>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stjärnor`}>
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

      {/* Note pyramid */}
      <section className="mt-6">
        <h2 className="font-display text-2xl">Doftpyramid</h2>
        <div className="mt-3">
          <NotePyramid top={scan.top_notes} heart={scan.heart_notes} base={scan.base_notes} />
        </div>
      </section>

      {/* Meters */}
      <section className="mt-6 space-y-4 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
        <h2 className="font-display text-2xl">Karaktär</h2>
        <MeterRow label="Hållbarhet" value={scan.longevity ?? 0} hint={intensityLabel(scan.longevity ?? 0)} />
        <MeterRow label="Sillage" value={scan.sillage ?? 0} hint={intensityLabel(scan.sillage ?? 0)} />
      </section>

      {/* Accords */}
      {scan.accords?.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
          <h2 className="font-display text-2xl">Ackord</h2>
          <div className="mt-4">
            <AccordBars accords={scan.accords as any} />
          </div>
        </section>
      )}

      {/* Occasions / seasons */}
      {(scan.occasions?.length || scan.seasons?.length) && (
        <section className="mt-6 grid grid-cols-2 gap-3">
          {[
            { title: "Tillfällen", items: scan.occasions },
            { title: "Säsonger", items: scan.seasons },
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

      {/* Similar */}
      {Array.isArray(scan.similar_perfumes) && scan.similar_perfumes.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="font-display text-2xl">Liknande parfymer</h2>
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

      {/* Notes */}
      <section className="mt-6">
        <h2 className="font-display text-2xl">Anteckning</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Hur upplevde du doften?"
          className="mt-3 min-h-[100px] rounded-2xl border-border bg-card/60 backdrop-blur"
        />
        <Button
          onClick={saveNotes}
          disabled={savingNotes}
          className="mt-3 h-11 w-full rounded-2xl bg-gradient-luxe text-primary-foreground shadow-soft hover:opacity-90"
        >
          {savingNotes ? "Sparar…" : "Spara anteckning"}
        </Button>
      </section>

      <Button
        variant="ghost"
        onClick={remove}
        className="mt-6 h-11 w-full rounded-2xl text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Ta bort scanning
      </Button>
    </AppShell>
  );
}
