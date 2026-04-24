import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/taste")({
  component: TastePage,
});

const ACCORDS = [
  "Träig", "Blommig", "Citrus", "Orientalisk", "Gourmand",
  "Chypré", "Fougère", "Aquatic", "Pudrig", "Mossig", "Krydda", "Fruktig",
];

const SEASONS = ["Vår", "Sommar", "Höst", "Vinter"];
const INTENSITIES = [
  { id: "lätt", label: "Lätt & fräsch" },
  { id: "balanserad", label: "Balanserad" },
  { id: "stark", label: "Stark & djup" },
];
const GENDERS = ["Herr", "Dam", "Unisex"];

function TastePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [favAccords, setFavAccords] = useState<string[]>([]);
  const [dislAccords, setDislAccords] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<string>("balanserad");
  const [gender, setGender] = useState<string>("Unisex");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("taste_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setFavAccords(data.favorite_accords ?? []);
        setDislAccords(data.disliked_accords ?? []);
        setSeasons(data.preferred_seasons ?? []);
        setIntensity(data.preferred_intensity ?? "balanserad");
        setGender(data.gender_preference ?? "Unisex");
      }
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const toggle = (set: string[], setSet: (v: string[]) => void, value: string) => {
    setSet(set.includes(value) ? set.filter((x) => x !== value) : [...set, value]);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("taste_profile").upsert({
      user_id: user.id,
      favorite_accords: favAccords,
      disliked_accords: dislAccords,
      preferred_seasons: seasons,
      preferred_intensity: intensity,
      gender_preference: gender,
    });
    setSaving(false);
    if (error) {
      toast.error("Kunde inte spara");
      return;
    }
    toast.success("Smakprofil sparad");
    navigate({ to: "/for-you" });
  };

  if (loading) {
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
      <div className="mt-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">Smakprofil</p>
        <h1 className="mt-2 font-display text-3xl">Vad gillar du?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hjälp oss förstå din doft — vi finslipar förslagen automatiskt baserat på dina reaktioner också.
        </p>
      </div>

      <Section title="Favoritfamiljer" hint="Välj så många du vill">
        <Chips items={ACCORDS} selected={favAccords} onToggle={(v) => toggle(favAccords, setFavAccords, v)} variant="like" />
      </Section>

      <Section title="Undvik" hint="Familjer du inte gillar">
        <Chips items={ACCORDS} selected={dislAccords} onToggle={(v) => toggle(dislAccords, setDislAccords, v)} variant="dislike" />
      </Section>

      <Section title="Säsong">
        <Chips items={SEASONS} selected={seasons} onToggle={(v) => toggle(seasons, setSeasons, v)} variant="like" />
      </Section>

      <Section title="Intensitet">
        <div className="grid grid-cols-3 gap-2">
          {INTENSITIES.map((i) => (
            <button
              key={i.id}
              onClick={() => setIntensity(i.id)}
              className={cn(
                "rounded-2xl border p-3 text-xs font-medium transition",
                intensity === i.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Inriktning">
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={cn(
                "rounded-2xl border p-3 text-xs font-medium transition",
                gender === g
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </Section>

      <Button
        onClick={save}
        disabled={saving}
        className="mt-8 h-14 w-full rounded-2xl bg-gradient-luxe text-base font-medium text-primary-foreground shadow-elegant hover:opacity-90"
      >
        {saving ? "Sparar…" : "Spara smakprofil"}
      </Button>
    </AppShell>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl">{title}</h2>
        {hint && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Chips({
  items,
  selected,
  onToggle,
  variant,
}: {
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
  variant: "like" | "dislike";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = selected.includes(it);
        return (
          <button
            key={it}
            type="button"
            onClick={() => onToggle(it)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs transition",
              active
                ? variant === "like"
                  ? "border-gold/50 bg-gold/15 text-gold"
                  : "border-border bg-muted text-foreground"
                : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
            )}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}
