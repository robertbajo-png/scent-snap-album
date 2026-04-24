import { cn } from "@/lib/utils";

export function MeterRow({
  label,
  value,
  max = 5,
  hint,
}: {
  label: string;
  value: number;
  max?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full",
              i < value ? "bg-gradient-gold" : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}
