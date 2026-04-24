import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const t = useT();
  return (
    <AppShell>
      <Logo />
      <article className="mt-8 space-y-6">
        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">{t("about.eyebrow")}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight">
            {t("about.title_1")}
            <span className="italic text-primary">{t("about.title_2")}</span>
          </h1>
        </header>

        <p className="text-foreground/90">{t("about.intro")}</p>

        <section className="space-y-3">
          <h2 className="font-display text-xl">{t("about.what_you_get")}</h2>
          {[
            { t: t("about.f1_t"), s: t("about.f1_s") },
            { t: t("about.f2_t"), s: t("about.f2_s") },
            { t: t("about.f3_t"), s: t("about.f3_s") },
            { t: t("about.f4_t"), s: t("about.f4_s") },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <p className="font-medium">{f.t}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{f.s}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-gradient-luxe p-5 text-primary-foreground">
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">{t("about.tip_label")}</p>
          <p className="mt-1 font-display text-lg">{t("about.tip")}</p>
        </section>

        <Link
          to="/"
          className="inline-flex h-12 items-center rounded-2xl bg-gradient-luxe px-5 text-sm font-medium text-primary-foreground shadow-elegant"
        >
          {t("about.cta")}
        </Link>
      </article>
    </AppShell>
  );
}
