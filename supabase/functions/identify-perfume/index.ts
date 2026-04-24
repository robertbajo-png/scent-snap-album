import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_SV = `Du är en världsledande parfymexpert (parfymör/recensent) inspirerad av källor som Fragrantica.
Givet en bild på en parfymflaska, etikett eller förpackning, identifiera parfymen och returnera rik, korrekt metadata på SVENSKA.

Regler:
- Om du inte kan läsa flaskan tydligt, gör en kvalificerad gissning baserat på visuell stil och justera confidence.
- Noter (top/heart/base) ska vara specifika (t.ex. "Bergamott", "Iris", "Sandelträ", "Ambroxan"). 3-6 per lager.
- Accords är breda olfaktoriska familjer med intensity 0-100 (t.ex. "Träig", "Blommig", "Orientalisk", "Citrus", "Gourmand", "Chypré", "Fougère", "Aquatic", "Mossig", "Pudrig").
- longevity & sillage: 1-5.
- gender: "Herr" | "Dam" | "Unisex".
- description: 2-4 meningar på svenska, evokativ och konkret (poetisk parfymör-stil).
- plain_description: 1-2 korta meningar på enkel, vardaglig svenska — som om du förklarar för en vän som inte kan parfym. Undvik fackord.
- similar_perfumes: 3 förslag.
- confidence: 0-1.
- Svara ALLTID via verktyget 'return_perfume'.`;

const SYSTEM_EN = `You are a world-class perfume expert (perfumer/fragrance reviewer) inspired by sources like Fragrantica.
Given a photo of a perfume bottle, label or packaging, identify the perfume and return rich, accurate metadata in ENGLISH.

Rules:
- If you cannot read the bottle clearly, make an educated guess based on visual style and adjust confidence accordingly.
- Notes (top/heart/base) must be specific (e.g. "Bergamot", "Iris", "Sandalwood", "Ambroxan"). 3-6 per layer.
- Accords are broad olfactory families with intensity 0-100 (e.g. "Woody", "Floral", "Oriental", "Citrus", "Gourmand", "Chypre", "Fougère", "Aquatic", "Mossy", "Powdery").
- longevity & sillage: 1-5.
- gender: must be one of these exact tokens: "Herr" (men), "Dam" (women), "Unisex". Always use these tokens regardless of language.
- description: 2-4 sentences in English, evocative and concrete (poetic perfumer style).
- plain_description: 1-2 short sentences in simple, everyday English — as if explaining to a friend who knows nothing about perfume. Avoid jargon.
- similar_perfumes: 3 suggestions.
- confidence: 0-1.
- Always respond by calling the tool 'return_perfume'.`;

const USER_PROMPT_SV = "Identifiera denna parfym och returnera all metadata via verktyget.";
const USER_PROMPT_EN = "Identify this perfume and return all metadata via the tool.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, imageUrl, language } = await req.json();
    const lang: "sv" | "en" = language === "en" ? "en" : "sv";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!imageBase64 && !imageUrl) throw new Error("imageBase64 or imageUrl required");

    const userContent: any[] = [
      { type: "text", text: lang === "en" ? USER_PROMPT_EN : USER_PROMPT_SV },
      {
        type: "image_url",
        image_url: { url: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : imageUrl },
      },
    ];

    const tool = {
      type: "function",
      function: {
        name: "return_perfume",
        description: "Return identified perfume information",
        parameters: {
          type: "object",
          properties: {
            brand: { type: "string" },
            name: { type: "string" },
            perfumer: { type: "string" },
            year: { type: "number" },
            gender: { type: "string", enum: ["Herr", "Dam", "Unisex"] },
            description: { type: "string" },
            plain_description: { type: "string" },
            top_notes: { type: "array", items: { type: "string" } },
            heart_notes: { type: "array", items: { type: "string" } },
            base_notes: { type: "array", items: { type: "string" } },
            accords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  intensity: { type: "number" },
                },
                required: ["name", "intensity"],
                additionalProperties: false,
              },
            },
            longevity: { type: "number" },
            sillage: { type: "number" },
            occasions: { type: "array", items: { type: "string" } },
            seasons: { type: "array", items: { type: "string" } },
            similar_perfumes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  brand: { type: "string" },
                  name: { type: "string" },
                  why: { type: "string" },
                },
                required: ["brand", "name", "why"],
                additionalProperties: false,
              },
            },
            confidence: { type: "number" },
          },
          required: [
            "brand", "name", "description", "plain_description",
            "top_notes", "heart_notes", "base_notes",
            "accords", "longevity", "sillage",
            "occasions", "seasons", "similar_perfumes", "confidence",
          ],
          additionalProperties: false,
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: lang === "en" ? SYSTEM_EN : SYSTEM_SV },
          { role: "user", content: userContent },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_perfume" } },
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
      console.error("No tool call returned", JSON.stringify(data));
      return new Response(JSON.stringify({ error: lang === "en" ? "Couldn't parse the perfume" : "Kunde inte tolka parfymen" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ perfume: parsed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("identify-perfume error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
