import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { useT } from "@/lib/i18n";

const CONTACT_EMAIL = "robert.bajo@gmail.com";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — ScentSnap" },
      { name: "description", content: "How ScentSnap handles your data, images and payments." },
    ],
  }),
});

function PrivacyPage() {
  const t = useT();
  const sections: { h: string; p: string }[] = [
    { h: t("privacy.h_data"), p: t("privacy.p_data") },
    { h: t("privacy.h_ai"), p: t("privacy.p_ai") },
    { h: t("privacy.h_payments"), p: t("privacy.p_payments") },
    { h: t("privacy.h_share"), p: t("privacy.p_share") },
    { h: t("privacy.h_rights"), p: t("privacy.p_rights") },
    { h: t("privacy.h_contact"), p: t("privacy.p_contact", { email: CONTACT_EMAIL }) },
  ];

  return (
    <AppShell>
      <Logo />
      <article className="mt-8 space-y-6">
        <header>
          <h1 className="font-display text-3xl">{t("privacy.title")}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{t("privacy.updated")}</p>
        </header>
        <p className="text-foreground/90">{t("privacy.intro")}</p>
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
