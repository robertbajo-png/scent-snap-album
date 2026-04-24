export function NotePyramid({
  top,
  heart,
  base,
}: {
  top: string[];
  heart: string[];
  base: string[];
}) {
  const layers = [
    { label: "Topp", notes: top, sub: "Första intrycket — flyktigt" },
    { label: "Hjärta", notes: heart, sub: "Personligheten — 1–4 h" },
    { label: "Bas", notes: base, sub: "Grunden — flera timmar" },
  ];
  return (
    <div className="space-y-3">
      {layers.map((l) => (
        <div
          key={l.label}
          className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur"
        >
          <div className="mb-2 flex items-baseline justify-between">
            <h4 className="font-display text-lg">{l.label}</h4>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {l.sub}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {l.notes.map((n) => (
              <span
                key={n}
                className="rounded-full border border-gold/30 bg-gold-soft/30 px-3 py-1 text-xs font-medium text-foreground"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
