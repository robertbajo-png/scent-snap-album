import { Heart, Sparkle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { Reaction } from "@/lib/types";

export function ReactionPicker({
  value,
  onChange,
  size = "md",
}: {
  value: Reaction;
  onChange: (next: Reaction) => void;
  size?: "sm" | "md";
}) {
  const t = useT();
  const opts: { id: Exclude<Reaction, null>; label: string; Icon: any; activeClass: string }[] = [
    { id: "like", label: t("reaction.like"), Icon: Heart, activeClass: "bg-rose-500/15 text-rose-500 border-rose-500/40" },
    { id: "want", label: t("reaction.want"), Icon: Sparkle, activeClass: "bg-gold/15 text-gold border-gold/50" },
    { id: "dislike", label: t("reaction.dislike"), Icon: X, activeClass: "bg-muted text-muted-foreground border-border" },
  ];
  return (
    <div className={cn("grid grid-cols-3 gap-2", size === "sm" && "gap-1.5")}>
      {opts.map(({ id, label, Icon, activeClass }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(active ? null : id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl border transition",
              size === "md" ? "h-16 text-xs" : "h-12 text-[11px]",
              active
                ? activeClass + " shadow-soft"
                : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={active}
          >
            <Icon className={cn(size === "md" ? "h-5 w-5" : "h-4 w-4")} strokeWidth={1.7} />
            <span className="font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
