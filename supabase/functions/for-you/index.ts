import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_SV = `Du är en parfymexpert. Baserat på användarens smakprofil och scanninghistorik, föreslå 6 parfymer på SVENSKA.
Varje förslag ska vara verklig och välkänd. Förklara kort varför den passar (1-2 meningar).
Vikta signalerna så här (viktigast först):
1. "liked" och "wanted" parfymer + favoriter (is_favorite) och höga betyg (user_rating 4-5) — använd som starka positiva exempel.
2. "owned" — vad användaren redan äger; föreslå INTE samma parfymer, men använd profilen för att hitta liknande.
3. Smakprofilens favorite_accords / favorite_notes.
4. "disliked" parfymer + disliked_accords / disliked_notes — undvik liknande dofter.
Returnera ALLTID via verktyget 'return_recommendations'.`;

const SYSTEM_EN = `You are a perfume expert. Based on the user's taste profile and scan history, suggest 6 perfumes in ENGLISH.
Every suggestion must be real and well-known. Briefly explain why it fits (1-2 sentences).
Weight the signals like this (most important first):
1. "liked" and "wanted" perfumes + favorites (is_favorite) and high ratings (user_rating 4-5) — use as strong positive examples.
2. "owned" — what the user already owns; do NOT suggest the same perfumes, but use the profile to find similar ones.
3. Taste profile favorite_accords / favorite_notes.
4. "disliked" perfumes + disliked_accords / disliked_notes — avoid similar scents.
Always respond via the tool 'return_recommendations'.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tasteProfile, recentScans, language } = await req.json();
    const lang: "sv" | "en" = language === "en" ? "en" : "sv";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const tool = {
      type: "function",
      function: {
        name: "return_recommendations",
        description: "Return perfume recommendations",
        parameters: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  brand: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  why: { type: "string" },
                  top_accords: { type: "array", items: { type: "string" } },
                  gender: { type: "string" },
                },
                required: ["brand", "name", "description", "why", "top_accords", "gender"],
                additionalProperties: false,
              },
            },
          },
          required: ["recommendations"],
          additionalProperties: false,
        },
      },
    };

    const scans = Array.isArray(recentScans) ? recentScans : [];
    const liked = scans.filter((s: any) => s?.reaction === "like").slice(0, 10);
    const wanted = scans.filter((s: any) => s?.reaction === "want").slice(0, 10);
    const disliked = scans.filter((s: any) => s?.reaction === "dislike").slice(0, 10);
    const owned = scans.filter((s: any) => s?.owned === true).slice(0, 20);
    const favorites = scans.filter((s: any) => s?.is_favorite === true || (typeof s?.user_rating === "number" && s.user_rating >= 4)).slice(0, 10);
    const other = scans.filter((s: any) => !s?.reaction && !s?.owned && !s?.is_favorite).slice(0, 10);

    const userMsg =
      lang === "en"
        ? `Taste profile: ${JSON.stringify(tasteProfile ?? {})}
Liked perfumes: ${JSON.stringify(liked)}
Wanted perfumes: ${JSON.stringify(wanted)}
Owned perfumes (do NOT recommend these): ${JSON.stringify(owned)}
Favorites / high-rated: ${JSON.stringify(favorites)}
Disliked perfumes (avoid similar): ${JSON.stringify(disliked)}
Other recent scans: ${JSON.stringify(other)}`
        : `Smakprofil: ${JSON.stringify(tasteProfile ?? {})}
Gillade parfymer: ${JSON.stringify(liked)}
Vill ha-parfymer: ${JSON.stringify(wanted)}
Ägda parfymer (rekommendera INTE dessa): ${JSON.stringify(owned)}
Favoriter / högt betygsatta: ${JSON.stringify(favorites)}
Ogillade parfymer (undvik liknande): ${JSON.stringify(disliked)}
Andra senaste scanningar: ${JSON.stringify(other)}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: lang === "en" ? SYSTEM_EN : SYSTEM_SV },
          { role: "user", content: userMsg },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_recommendations" } },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI gateway error", resp.status, text);
      const errMsg =
        resp.status === 429
          ? lang === "en" ? "Too many requests, please try again shortly." : "För många förfrågningar, försök igen om en stund."
          : resp.status === 402
          ? lang === "en" ? "Lovable AI credits exhausted." : "Krediter slut för Lovable AI."
          : lang === "en" ? "AI service unavailable" : "AI-tjänsten är inte tillgänglig";
      return new Response(JSON.stringify({ error: errMsg }), {
        status: resp.status === 429 || resp.status === 402 ? resp.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("for-you error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
