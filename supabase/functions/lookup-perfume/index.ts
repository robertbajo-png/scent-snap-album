import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_SV = `Du är en parfymexpert (parfymör) inspirerad av Fragrantica.
Användaren ger dig ett textsökord (märke, parfymnamn, eller en blandning).
Identifiera den mest sannolika parfymen och returnera rik metadata på SVENSKA.

Regler:
- top_notes / heart_notes / base_notes: 3-6 specifika noter per lager.
- accords: olfaktoriska familjer med intensity 0-100.
- longevity & sillage: 1-5.
- gender: "Herr" | "Dam" | "Unisex".
- description: 2-4 meningar, evokativ parfymör-stil.
- plain_description: 1-2 meningar på enkel vardagssvenska.
- similar_perfumes: 3 förslag.
- confidence: 0-1 (lägre om sökordet är otydligt).
- Svara ALLTID via verktyget 'return_perfume'.`;

const SYSTEM_EN = `You are a perfume expert inspired by Fragrantica.
The user provides a text query (brand, perfume name, or a mix).
Identify the most likely perfume and return rich metadata in ENGLISH.

Rules:
- top_notes / heart_notes / base_notes: 3-6 specific notes per layer.
- accords: olfactory families with intensity 0-100.
- longevity & sillage: 1-5.
- gender: must be one of these exact tokens: "Herr", "Dam", "Unisex".
- description: 2-4 sentences, evocative perfumer style.
- plain_description: 1-2 sentences in plain everyday English.
- similar_perfumes: 3 suggestions.
- confidence: 0-1 (lower if the query is unclear).
- Always respond via the tool 'return_perfume'.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, language } = await req.json();
    const lang: "sv" | "en" = language === "en" ? "en" : "sv";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!query || typeof query !== "string") throw new Error(lang === "en" ? "query required" : "query krävs");

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

    const userMsg =
      lang === "en"
        ? `Query: "${query}". Identify the perfume and return metadata via the tool.`
        : `Sökord: "${query}". Identifiera parfymen och returnera metadata via verktyget.`;

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
          { role: "user", content: userMsg },
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
      return new Response(JSON.stringify({ error: lang === "en" ? "Couldn't find the perfume" : "Kunde inte hitta parfymen" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ perfume: parsed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lookup-perfume error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
