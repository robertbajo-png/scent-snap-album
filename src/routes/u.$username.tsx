import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Heart, Package, FlaskConical, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";

type PublicProfile = {
  username: string;
  owned_count: number;
  want_count: number;
  favorite_count: number;
  tried_count: number;
};

type PublicScent = {
  id: string;
  brand: string;
  name: string;
  image_url: string | null;
  owned: boolean;
  reaction: string | null;
  is_favorite: boolean;
  tried: boolean;
  bottle_size: string | null;
  updated_at: string;
};

export const Route = createFileRoute("/u/$username")({
  component: PublicProfilePage,
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — ScentSnap` },
      { name: "description", content: `${params.username}'s perfume shelf on ScentSnap.` },
      { property: "og:title", content: `@${params.username} — ScentSnap` },
      { property: "og:description", content: `Explore ${params.username}'s public perfume shelf.` },
    ],
  }),
});

function PublicProfilePage() {
  const { username } = Route.useParams();
  const { t } = useI18n();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [scents, setScents] = useState<PublicScent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: pData }, { data: sData }] = await Promise.all([
        supabase.rpc("get_public_profile", { _username: username }),
        supabase.rpc("get_public_collection", { _username: username }),
      ]);
      if (cancelled) return;
      const p = Array.isArray(pData) ? pData[0] : pData;
      setProfile((p as PublicProfile) ?? null);
      setScents(((sData as PublicScent[]) ?? []));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <AppShell>
        <Logo />
        <div className="mt-12 space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-card/60" />
          <div className="h-24 animate-pulse rounded-2xl bg-card/60" />
          <div className="h-24 animate-pulse rounded-2xl bg-card/60" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <Logo />
        <div className="mt-20 text-center">
          <h1 className="font-display text-3xl">{t("public.private_title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("public.private_desc")}</p>
          <Link
            to="/"
            className="mt-6 inline-flex h-12 items-center rounded-2xl bg-gradient-luxe px-6 text-sm font-medium text-primary-foreground shadow-elegant"
          >
            {t("public.back_home")}
          </Link>
        </div>
      </AppShell>
    );
  }

  const owned = scents.filter((s) => s.owned);
  const wants = scents.filter((s) => s.reaction === "want");
  const favorites = scents.filter((s) => s.is_favorite).slice(0, 5);
  const tried = scents.filter((s) => s.tried);

  return (
    <AppShell>
      <Logo />

      <header className="mt-6 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-luxe text-2xl font-display text-primary-foreground shadow-elegant">
          {profile.username[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl">@{profile.username}</h1>
          <p className="text-xs text-muted-foreground">{t("public.powered_by")}</p>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-4 gap-2">
        <StatBox icon={Package} label={t("public.owns")} value={profile.owned_count} />
        <StatBox icon={Sparkles} label={t("public.wants")} value={profile.want_count} />
        <StatBox icon={FlaskConical} label={t("public.tried")} value={profile.tried_count} />
        <StatBox icon={Star} label={t("public.favorites")} value={profile.favorite_count} />
      </div>

      {scents.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("public.empty")}
        </div>
      )}

      {favorites.length > 0 && (
        <Section title={t("public.favorites")} icon={Heart}>
          <Grid items={favorites} />
        </Section>
      )}

      {owned.length > 0 && (
        <Section title={t("public.owns")} icon={Package} count={owned.length}>
          <Grid items={owned} />
        </Section>
      )}

      {wants.length > 0 && (
        <Section title={t("public.wants")} icon={Sparkles} count={wants.length}>
          <Grid items={wants} />
        </Section>
      )}

      {tried.length > 0 && (
        <Section title={t("public.tried")} icon={FlaskConical} count={tried.length}>
          <Grid items={tried} />
        </Section>
      )}

      <div className="mt-10 mb-6 text-center">
        <Link
          to="/"
          className="inline-flex h-11 items-center rounded-2xl border border-border bg-card/60 px-5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {t("public.back_home")}
        </Link>
      </div>
    </AppShell>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-gold" strokeWidth={1.7} />
      <p className="mt-1 font-display text-xl leading-tight">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: any;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold" strokeWidth={1.7} />
        <h2 className="font-display text-xl leading-none">{title}</h2>
        {typeof count === "number" && (
          <span className="text-xs text-muted-foreground">({count})</span>
        )}
      </div>
      {children}
    </section>
  );
}

function Grid({ items }: { items: PublicScent[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((s) => (
        <div
          key={s.id}
          className="overflow-hidden rounded-2xl border border-border/60 bg-card/60"
        >
          {s.image_url ? (
            <img
              src={s.image_url}
              alt={`${s.brand} ${s.name}`}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="grid aspect-square w-full place-items-center bg-gradient-luxe text-3xl font-display text-primary-foreground">
              {s.brand?.[0] ?? "?"}
            </div>
          )}
          <div className="p-2.5">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.brand}</p>
            <p className="truncate text-sm font-medium leading-tight">{s.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
