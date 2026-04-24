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

export function ManualLookupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const q = query.trim();
    if (!q) return;
    if (!user) {
      onOpenChange(false);
      navigate({ to: "/login" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-perfume", {
        body: { query: q },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const p = data.perfume;
      const { data: inserted, error: insErr } = await supabase
        .from("scans")
        .insert({
          user_id: user.id,
          image_url: null,
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
      toast.error(e?.message ?? "Kunde inte hitta parfymen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Sök parfym manuellt</DialogTitle>
          <DialogDescription>
            Skriv märke och/eller namn — t.ex. "Dior Sauvage" eller "Baccarat Rouge".
          </DialogDescription>
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
              placeholder="Märke och namn"
              className="h-12 rounded-2xl border-border bg-card/60 pl-11"
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-12 w-full rounded-2xl bg-gradient-luxe text-primary-foreground shadow-soft hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Letar upp…
              </>
            ) : (
              "Identifiera"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
