import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Sparkles, Loader2, X, Search, Crown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ManualLookupDialog } from "@/components/ManualLookupDialog";
import { PaywallDialog } from "@/components/PaywallDialog";
import { useQuota, FREE_DAILY_LIMIT } from "@/hooks/useQuota";
import heroImg from "@/assets/hero-perfume.jpg";

export const Route = createFileRoute("/")({
  component: ScanPage,
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      resolve(s.split(",")[1]);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function ScanPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const quota = useQuota();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error(t("scan.image_too_large"));
      return;
    }
    setFile(f);
  };

  const reset = () => setFile(null);

  const scan = async () => {
    if (!file) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!quota.canScan) {
      setPaywallOpen(true);
      return;
    }
    setScanning(true);
    try {
      const base64 = await fileToBase64(file);

      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("perfume-images")
        .upload(path, file, { contentType: file.type });
      if (upErr) console.warn("upload failed", upErr);
      const { data: urlData } = supabase.storage.from("perfume-images").getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      const { data, error } = await supabase.functions.invoke("identify-perfume", {
        body: { imageBase64: base64, language: lang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const p = data.perfume;

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

      quota.refresh();
      navigate({ to: "/scent/$id", params: { id: inserted.id } });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? t("common.something_wrong"));
    } finally {
      setScanning(false);
    }
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <Logo />
        {!authLoading && !user && (
          <Link
            to="/login"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {t("common.login")}
          </Link>
        )}
      </div>

      <section className="mt-8 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
          {t("scan.tag")}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground">
          {t("scan.title_1")}
          <br />
          <span className="italic text-primary">{t("scan.title_2")}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
          {t("scan.subtitle")}
        </p>
      </section>

      {user && !quota.loading && !quota.isPremium && (
        <button
          onClick={() => setPaywallOpen(true)}
          className="mt-5 flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-left transition hover:bg-card"
        >
          <div className="flex items-center gap-3">
            <Crown className="h-4 w-4 text-gold" strokeWidth={1.7} />
            <div>
              <p className="text-sm font-medium">
                {quota.canScan
                  ? `${quota.remaining} av ${FREE_DAILY_LIMIT} skanningar kvar idag`
                  : "Du har använt dina gratis-skanningar"}
              </p>
              <p className="text-xs text-muted-foreground">
                Uppgradera för obegränsad användning
              </p>
            </div>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-gold">Premium</span>
        </button>
      )}

      {user && quota.isPremium && (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-gold/30 bg-gradient-luxe/10 px-4 py-3">
          <Crown className="h-4 w-4 text-gold" strokeWidth={1.7} />
          <p className="text-sm font-medium">Premium aktiv — obegränsade skanningar</p>
        </div>
      )}

      <div className="relative mt-6">
        {previewUrl ? (
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
            <img
              src={previewUrl}
              alt={t("scan.preview_alt")}
              className="aspect-[4/5] w-full object-cover"
            />
            <button
              onClick={reset}
              disabled={scanning}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:bg-background"
              aria-label={t("scan.remove_image")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-elegant">
            <img
              src={heroImg}
              alt={t("scan.hero_alt")}
              width={1536}
              height={1024}
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-veil" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-gold/90">
                {t("scan.hero_caption_eyebrow")}
              </p>
              <p className="mt-1 font-display text-xl text-white">
                {t("scan.hero_caption")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3">
        {previewUrl ? (
          <Button
            size="lg"
            disabled={scanning}
            onClick={scan}
            className="h-14 rounded-2xl bg-gradient-luxe text-base font-medium text-primary-foreground shadow-elegant hover:opacity-90"
          >
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("scan.analyzing")}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {t("scan.identify")}
              </>
            )}
          </Button>
        ) : (
          <>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <Button
              size="lg"
              onClick={() => cameraRef.current?.click()}
              className="h-14 rounded-2xl bg-gradient-luxe text-base font-medium text-primary-foreground shadow-elegant hover:opacity-90"
            >
              <Camera className="mr-2 h-5 w-5" />
              {t("scan.open_camera")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="h-14 rounded-2xl border-border bg-card/50 text-base font-medium backdrop-blur hover:bg-card"
            >
              <Upload className="mr-2 h-5 w-5" />
              {t("scan.upload")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLookupOpen(true)}
              className="h-14 rounded-2xl border-border bg-card/50 text-base font-medium backdrop-blur hover:bg-card"
            >
              <Search className="mr-2 h-5 w-5" />
              {t("scan.search_by_name")}
            </Button>
          </>
        )}
      </div>

      {scanning && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t("scan.takes_seconds")}
        </p>
      )}

      <ManualLookupDialog open={lookupOpen} onOpenChange={setLookupOpen} />
      <PaywallDialog open={paywallOpen} onOpenChange={setPaywallOpen} reason={!quota.canScan ? `Du har använt dina ${FREE_DAILY_LIMIT} gratis-skanningar för idag.` : undefined} />

      <section className="mt-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          {t("scan.how_it_works")}
        </p>
        <ol className="mt-3 space-y-3">
          {[
            { n: "01", t: t("scan.step1_title"), s: t("scan.step1_sub") },
            { n: "02", t: t("scan.step2_title"), s: t("scan.step2_sub") },
            { n: "03", t: t("scan.step3_title"), s: t("scan.step3_sub") },
          ].map((s) => (
            <li key={s.n} className="flex gap-4 rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur">
              <span className="font-display text-2xl text-gold">{s.n}</span>
              <div>
                <p className="font-medium">{s.t}</p>
                <p className="text-xs text-muted-foreground">{s.s}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </AppShell>
  );
}
