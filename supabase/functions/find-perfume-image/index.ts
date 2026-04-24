import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function isLikelyBottleImage(url: string): boolean {
  if (!url.startsWith("http")) return false;
  const lower = url.toLowerCase();
  // Skip Google's own thumbnail/static infrastructure
  if (lower.includes("gstatic.com")) return false;
  if (lower.includes("googleusercontent.com")) return false;
  if (lower.includes("google.com/")) return false;
  if (lower.includes(".svg")) return false;
  if (lower.includes("logo")) return false;
  return /\.(jpg|jpeg|png|webp)(\?|$)/i.test(lower);
}

function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  // Google embeds image data as ["https://...jpg",height,width]
  const re = /\["(https?:\\?\/\\?\/[^"]+?\.(?:jpg|jpeg|png|webp))",\s*\d+,\s*\d+\]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const cleaned = m[1].replace(/\\\//g, "/").replace(/\\u003d/g, "=").replace(/\\u0026/g, "&");
    if (isLikelyBottleImage(cleaned) && !urls.includes(cleaned)) {
      urls.push(cleaned);
    }
    if (urls.length >= 5) break;
  }
  return urls;
}

async function searchBing(query: string, signal: AbortSignal): Promise<string[]> {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`;
  const resp = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    signal,
  });
  if (!resp.ok) return [];
  const html = await resp.text();
  const urls: string[] = [];
  // Bing stores image url in m="...&quot;murl&quot;:&quot;https://...jpg&quot;..."
  const re = /murl&quot;:&quot;(https?:\/\/[^"&]+?\.(?:jpg|jpeg|png|webp))&quot;/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const u = m[1];
    if (isLikelyBottleImage(u) && !urls.includes(u)) urls.push(u);
    if (urls.length >= 5) break;
  }
  return urls;
}

async function searchGoogle(query: string, signal: AbortSignal): Promise<string[]> {
  const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}&safe=active`;
  const resp = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    signal,
  });
  if (!resp.ok) return [];
  const html = await resp.text();
  return extractImageUrls(html);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { brand, name } = await req.json();
    if (!brand || !name || typeof brand !== "string" || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "brand and name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeBrand = brand.slice(0, 100);
    const safeName = name.slice(0, 100);
    const query = `${safeBrand} ${safeName} perfume bottle`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let imageUrl: string | null = null;
    try {
      // Try Bing first (less aggressive bot detection), fall back to Google
      const bing = await searchBing(query, controller.signal);
      if (bing.length > 0) {
        imageUrl = bing[0];
      } else {
        const google = await searchGoogle(query, controller.signal);
        if (google.length > 0) imageUrl = google[0];
      }
    } catch (err) {
      console.warn("image search failed", err);
    } finally {
      clearTimeout(timeout);
    }

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("find-perfume-image error", e);
    return new Response(JSON.stringify({ imageUrl: null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
