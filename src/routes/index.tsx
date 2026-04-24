import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Sparkles, Loader2, X, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ManualLookupDialog } from "@/components/ManualLookupDialog";
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
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);

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
      toast.error("Bilden är för stor (max 10 MB)");
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
    setScanning(true);
    try {
      const base64 = await fileToBase64(file);

      // Upload image
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("perfume-images")
        .upload(path, file, { contentType: file.type });
      if (upErr) console.warn("upload failed", upErr);
      const { data: urlData } = supabase.storage.from("perfume-images").getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      // Identify
      const { data, error } = await supabase.functions.invoke("identify-perfume", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const p = data.perfume;

      // Save scan
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

      navigate({ to: "/scent/$id", params: { id: inserted.id } });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Något gick fel");
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
            Logga in
          </Link>
        )}
      </div>

      <section className="mt-8 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
          AI-driven parfymigenkänning
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-foreground">
          Fånga doften.
          <br />
          <span className="italic text-primary">Avslöja parfymen.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
          Fota flaskan eller etiketten — vi identifierar doftpyramid, ackord och liknande parfymer.
        </p>
      </section>

      <div className="relative mt-6">
        {previewUrl ? (
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
            <img
              src={previewUrl}
              alt="Förhandsvisning av parfym"
              className="aspect-[4/5] w-full object-cover"
            />
            <button
              onClick={reset}
              disabled={scanning}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:bg-background"
              aria-label="Ta bort bild"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-elegant">
            <img
              src={heroImg}
              alt="Lyxig parfymflaska"
              width={1536}
              height={1024}
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-veil" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-gold/90">
                Redo att scanna
              </p>
              <p className="mt-1 font-display text-xl text-white">
                Visa upp en flaska eller etikett
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
                Analyserar parfymen…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Identifiera parfym
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
              Öppna kamera
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="h-14 rounded-2xl border-border bg-card/50 text-base font-medium backdrop-blur hover:bg-card"
            >
              <Upload className="mr-2 h-5 w-5" />
              Ladda upp bild
            </Button>
          </>
        )}
      </div>

      {scanning && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Detta kan ta upp till 20 sekunder…
        </p>
      )}

      <section className="mt-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Så fungerar det
        </p>
        <ol className="mt-3 space-y-3">
          {[
            { n: "01", t: "Fota flaskan eller etiketten", s: "Tydligt ljus och fokus ger bäst resultat" },
            { n: "02", t: "AI:n identifierar parfymen", s: "Märke, doftnoter, ackord och beskrivning" },
            { n: "03", t: "Spara, betygsätt, hitta liknande", s: "Bygg din personliga doftgarderob" },
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
