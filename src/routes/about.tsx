import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "Om ScentSnap" },
      { name: "description", content: "Identifiera parfymer med AI — så här fungerar ScentSnap." },
    ],
  }),
});

function AboutPage() {
  return (
    <AppShell>
      <Logo />
      <article className="mt-8 space-y-6">
        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">Om</p>
          <h1 className="mt-2 font-display text-4xl leading-tight">
            Doftens DNA — <span className="italic text-primary">i fickan.</span>
          </h1>
        </header>

        <p className="text-foreground/90">
          ScentSnap använder avancerad AI-vision för att identifiera parfymer från bilder av flaskor och
          etiketter. Du får doftpyramid, ackord, hållbarhet och förslag på liknande parfymer — på sekunder.
        </p>

        <section className="space-y-3">
          <h2 className="font-display text-xl">Vad du får</h2>
          {[
            { t: "Komplett doftprofil", s: "Topp-, hjärt- och basnoter." },
            { t: "Ackord-karta", s: "De olfaktoriska familjerna med intensitet." },
            { t: "Personliga förslag", s: "AI komponerar parfymer som passar din smak." },
            { t: "Privat historik", s: "Bara du ser dina scanningar och favoriter." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <p className="font-medium">{f.t}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{f.s}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-gradient-luxe p-5 text-primary-foreground">
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">Tips</p>
          <p className="mt-1 font-display text-lg">
            Tydligt ljus och fokus på etiketten ger AI:n bäst förutsättningar.
          </p>
        </section>

        <Link
          to="/"
          className="inline-flex h-12 items-center rounded-2xl bg-gradient-luxe px-5 text-sm font-medium text-primary-foreground shadow-elegant"
        >
          Börja scanna
        </Link>
      </article>
    </AppShell>
  );
}
