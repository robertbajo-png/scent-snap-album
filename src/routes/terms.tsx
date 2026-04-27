import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { useT } from "@/lib/i18n";

const CONTACT_EMAIL = "robert.bajo@gmail.com";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — ScentSnap" },
      { name: "description", content: "Terms for using ScentSnap." },
    ],
  }),
});

function TermsPage() {
  const t = useT();
  const sections: { h: string; p: string }[] = [
    { h: t("terms.h_use"), p: t("terms.p_use") },
    { h: t("terms.h_account"), p: t("terms.p_account") },
    { h: t("terms.h_premium"), p: t("terms.p_premium") },
    { h: t("terms.h_liability"), p: t("terms.p_liability") },
    { h: t("terms.h_changes"), p: t("terms.p_changes") },
    { h: t("terms.h_contact"), p: t("terms.p_contact", { email: CONTACT_EMAIL }) },
  ];

  return (
    <AppShell>
      <Logo />
      <article className="mt-8 space-y-6">
        <header>
          <h1 className="font-display text-3xl">{t("terms.title")}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{t("terms.updated")}</p>
        </header>
        <p className="text-foreground/90">{t("terms.intro")}</p>
        {sections.map((s) => (
          <section key={s.h} className="space-y-1.5">
            <h2 className="font-display text-lg">{s.h}</h2>
            <p className="text-sm text-muted-foreground">{s.p}</p>
          </section>
        ))}
        <Link to="/me" className="inline-block text-xs text-primary underline">
          ← {t("common.back_home")}
        </Link>
      </article>
    </AppShell>
  );
}
