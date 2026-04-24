import type { Accord } from "@/lib/types";

export function AccordBars({ accords }: { accords: Accord[] }) {
  const sorted = [...accords].sort((a, b) => b.intensity - a.intensity).slice(0, 8);
  return (
    <div className="space-y-2.5">
      {sorted.map((a) => (
        <div key={a.name} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{a.name}</span>
            <span className="text-muted-foreground">{Math.round(a.intensity)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-gold"
              style={{ width: `${Math.min(100, Math.max(4, a.intensity))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
