import { cn } from "@/lib/utils";

export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-xl", md: "text-2xl", lg: "text-4xl" };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold shadow-glow">
        <span className="absolute inset-1 rounded-full bg-background/90" />
        <span className="relative h-2 w-2 rounded-full bg-gradient-gold" />
      </span>
      <span className={cn("font-display font-medium tracking-tight", sizes[size])}>
        Scent<span className="text-gold">Snap</span>
      </span>
    </div>
  );
}
