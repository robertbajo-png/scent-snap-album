import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Settings2, Heart, Camera, Sparkles, Sliders, Globe, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { PaywallDialog } from "@/components/PaywallDialog";
import { useQuota, FREE_DAILY_LIMIT } from "@/hooks/useQuota";
import { getStripeEnvironment } from "@/lib/stripe";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/me")({
  component: MePage,
});

function MePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, likes: 0, wants: 0 });
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const quota = useQuota();

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          returnUrl: `${window.location.origin}/me`,
          environment: getStripeEnvironment(),
        },
      });
      if (error || !data?.url) throw new Error(error?.message || data?.error || "Kunde inte öppna portalen");
      window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "Något gick fel");
    } finally {
      setPortalLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { count: total }, { count: likes }, { count: wants }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("scans").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("scans").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("reaction", "like"),
        supabase.from("scans").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("reaction", "want"),
      ]);
      setProfile(p);
      setStats({ total: total ?? 0, likes: likes ?? 0, wants: wants ?? 0 });
    })();
  }, [user]);

  const langs: { id: Lang; label: string }[] = [
    { id: "sv", label: t("me.language_sv") },
    { id: "en", label: t("me.language_en") },
  ];

  if (!authLoading && !user) {
    return (
      <AppShell>
        <Logo />
        <div className="mt-20 text-center">
          <h1 className="font-display text-3xl">{t("me.signed_out_title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("me.signed_out_sub")}</p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-12 items-center rounded-2xl bg-gradient-luxe px-6 text-sm font-medium text-primary-foreground shadow-elegant"
          >
            {t("common.login")}
          </Link>
        </div>

        <section className="mt-10 rounded-2xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gold" strokeWidth={1.7} />
            <p className="text-sm font-medium">{t("me.language")}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {langs.map((l) => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={cn(
                  "rounded-xl border p-2.5 text-sm font-medium transition",
                  lang === l.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Logo />

      <div className="mt-8 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-luxe text-2xl font-display text-primary-foreground shadow-elegant">
          {profile?.display_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl">{profile?.display_name ?? t("me.your_profile")}</h1>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("me.stat_scanned")}</p>
          <p className="mt-1 font-display text-3xl">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("me.stat_likes")}</p>
          <p className="mt-1 font-display text-3xl">{stats.likes}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("me.stat_wants")}</p>
          <p className="mt-1 font-display text-3xl">{stats.wants}</p>
        </div>
      </div>

      {!quota.loading && (
        quota.isPremium ? (
          <section className="mt-6 rounded-2xl border border-gold/40 bg-gradient-luxe/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-gold" strokeWidth={1.7} />
                <p className="text-sm font-semibold">Premium aktiv</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openPortal}
                disabled={portalLoading}
                className="rounded-xl"
              >
                {portalLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Hantera"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Obegränsade skanningar, full historik och rekommendationer.
            </p>
          </section>
        ) : (
          <button
            onClick={() => setPaywallOpen(true)}
            className="mt-6 w-full rounded-2xl border border-border/60 bg-card/60 p-4 text-left transition hover:bg-card"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-gold" strokeWidth={1.7} />
                <p className="text-sm font-semibold">Uppgradera till Premium</p>
              </div>
              <span className="text-xs font-medium text-gold">Från 49 kr/mån</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Du har {quota.remaining} av {FREE_DAILY_LIMIT} gratis-skanningar kvar idag.
            </p>
          </button>
        )
      )}

      <div className="mt-6 space-y-2">
        <MenuLink to="/" icon={Camera} label={t("me.menu_new_scan")} />
        <MenuLink to="/history" icon={Heart} label={t("me.menu_history")} />
        <MenuLink to="/for-you" icon={Sparkles} label={t("me.menu_for_you")} />
        <MenuLink to="/taste" icon={Sliders} label={t("me.menu_taste")} />
        <MenuLink to="/about" icon={Settings2} label={t("me.menu_about")} />
      </div>

      <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gold" strokeWidth={1.7} />
          <p className="text-sm font-medium">{t("me.language")}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {langs.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              className={cn(
                "rounded-xl border p-2.5 text-sm font-medium transition",
                lang === l.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <Button
        variant="outline"
        className="mt-6 h-12 w-full rounded-2xl"
        onClick={async () => {
          await signOut();
          toast.success(t("me.signed_out_toast"));
          navigate({ to: "/" });
        }}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {t("common.logout")}
      </Button>
    </AppShell>
  );
}

function MenuLink({ to, icon: Icon, label }: { to: any; icon: any; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 transition hover:bg-card"
    >
      <Icon className="h-4 w-4 text-gold" strokeWidth={1.7} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
