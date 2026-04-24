import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

type Stage = "idle" | "looking_up" | "fetching_image";

export function ManualLookupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const loading = stage !== "idle";

  const submit = async () => {
    const q = query.trim();
    if (!q) return;
    if (!user) {
      onOpenChange(false);
      navigate({ to: "/login" });
      return;
    }
    setStage("looking_up");
    try {
      const { data, error } = await supabase.functions.invoke("lookup-perfume", {
        body: { query: q, language: lang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const p = data.perfume;

      // Try to find a bottle image — non-blocking, falls back to null
      setStage("fetching_image");
      let imageUrl: string | null = null;
      try {
        const { data: imgData } = await supabase.functions.invoke("find-perfume-image", {
          body: { brand: p.brand, name: p.name },
        });
        if (imgData?.imageUrl) imageUrl = imgData.imageUrl as string;
      } catch (imgErr) {
        console.warn("image lookup failed", imgErr);
      }

      const { data: inserted, error: insErr } = await supabase
        .from("scans")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          brand: p.brand,
          name: p.name,
          perfumer: p.perfumer ?? null,
          year: p.year ?? null,
          gender: p.gender ?? null,
          description: p.description,
          plain_description: p.plain_description ?? null,
          top_notes: p.top_notes,
          heart_notes: p.heart_notes,
          base_notes: p.base_notes,
          accords: p.accords,
          longevity: p.longevity,
          sillage: p.sillage,
          occasions: p.occasions,
          seasons: p.seasons,
          similar_perfumes: p.similar_perfumes,
          confidence: p.confidence,
          raw_ai: p,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      onOpenChange(false);
      setQuery("");
      navigate({ to: "/scent/$id", params: { id: inserted.id } });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? t("lookup.not_found"));
    } finally {
      setStage("idle");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{t("lookup.title")}</DialogTitle>
          <DialogDescription>{t("lookup.desc")}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("lookup.placeholder")}
              className="h-12 rounded-2xl border-border bg-card/60 pl-11"
              disabled={loading}
            />
          </div>
          <p className="px-1 text-xs text-muted-foreground">{t("lookup.hint")}</p>
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-12 w-full rounded-2xl bg-gradient-luxe text-primary-foreground shadow-soft hover:opacity-90"
          >
            {stage === "looking_up" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("lookup.searching")}
              </>
            ) : stage === "fetching_image" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("lookup.fetching_image")}
              </>
            ) : (
              t("lookup.identify")
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
