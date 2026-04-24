import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, Search, Sparkle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { formatRelative } from "@/lib/perfume";
import { cn } from "@/lib/utils";
import type { Reaction, ScanRow } from "@/lib/types";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

type FilterId = "all" | Exclude<Reaction, null>;

function topAccord(s: ScanRow): string | null {
  const arr = Array.isArray(s.accords) ? (s.accords as any[]) : [];
  if (arr.length === 0) return null;
  return [...arr].sort((a, b) => (b.intensity ?? 0) - (a.intensity ?? 0))[0]?.name ?? null;
}

function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useI18n();
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [accordFilter, setAccordFilter] = useState<string | null>(null);

  const filters: { id: FilterId; label: string; Icon?: any }[] = [
    { id: "all", label: t("history.filter_all") },
    { id: "like", label: t("history.filter_like"), Icon: Heart },
    { id: "want", label: t("history.filter_want"), Icon: Sparkle },
    { id: "dislike", label: t("history.filter_dislike"), Icon: X },
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setScans(data as any);
      setLoading(false);
    })();
  }, [user, authLoading]);

  const accordOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of scans) {
      const arr = Array.isArray(s.accords) ? (s.accords as any[]) : [];
      for (const a of arr) {
        if (!a?.name) continue;
        counts.set(a.name, (counts.get(a.name) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name]) => name);
  }, [scans]);

  const filtered = scans
    .filter((s) => (filter === "all" ? true : s.reaction === filter))
    .filter((s) => {
      if (!accordFilter) return true;
      const arr = Array.isArray(s.accords) ? (s.accords as any[]) : [];
      return arr.some((a) => a?.name === accordFilter);
    })
    .filter((s) => {
      if (!q) return true;
      const hay = `${s.brand} ${s.name}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });

  if (!authLoading && !user) {
    return (
      <AppShell>
        <Logo />
        <div className="mt-20 text-center">
          <h1 className="font-display text-3xl">{t("history.login_title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("history.login_sub")}</p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-12 items-center rounded-2xl bg-gradient-luxe px-6 text-sm font-medium text-primary-foreground shadow-elegant"
          >
            {t("common.login")}
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Logo />
      <div className="mt-6">
        <h1 className="font-display text-3xl">{t("history.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("history.count", { n: scans.length })}</p>
      </div>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("history.search_placeholder")}
          className="h-12 rounded-2xl border-border bg-card/60 pl-11 backdrop-blur"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {filters.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition",
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card/40 text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.Icon && <tab.Icon className="h-3 w-3" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {accordOptions.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setAccordFilter(null)}
            className={cn(
              "flex-none rounded-full px-3 py-1 text-[11px] uppercase tracking-wider transition",
              accordFilter === null
                ? "bg-gold/15 text-gold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("history.all_families")}
          </button>
          {accordOptions.map((a) => (
            <button
              key={a}
              onClick={() => setAccordFilter(accordFilter === a ? null : a)}
              className={cn(
                "flex-none rounded-full px-3 py-1 text-[11px] uppercase tracking-wider transition",
                accordFilter === a
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-card/60" />
          ))
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {scans.length === 0 ? t("history.empty_none") : t("history.empty_filter")}
          </div>
        ) : (
          filtered.map((s) => {
            const a = topAccord(s);
            return (
              <Link
                key={s.id}
                to="/scent/$id"
                params={{ id: s.id }}
                className="flex gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur transition hover:shadow-soft"
              >
                {s.image_url ? (
                  <img
                    src={s.image_url}
                    alt={`${s.brand} ${s.name}`}
                    loading="lazy"
                    className="h-20 w-20 flex-none rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 flex-none place-items-center rounded-xl bg-gradient-luxe text-2xl font-display text-primary-foreground">
                    {s.brand?.[0] ?? "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.brand}</p>
                  <p className="truncate font-display text-lg leading-tight">{s.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{formatRelative(s.created_at, lang)}</span>
                    {a && <span>· {a}</span>}
                  </div>
                </div>
                {s.reaction === "like" && <Heart className="h-4 w-4 flex-none fill-rose-500 text-rose-500" />}
                {s.reaction === "want" && <Sparkle className="h-4 w-4 flex-none fill-gold text-gold" />}
                {s.reaction === "dislike" && <X className="h-4 w-4 flex-none text-muted-foreground" />}
              </Link>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
