import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Du är en parfymexpert (parfymör) inspirerad av Fragrantica.
Användaren ger dig ett textsökord (märke, parfymnamn, eller en blandning).
Identifiera den mest sannolika parfymen och returnera rik metadata på svenska.

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!query || typeof query !== "string") throw new Error("query krävs");

    const tool = {
      type: "function",
      function: {
        name: "return_perfume",
        description: "Returnera identifierad parfyminformation",
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
          { role: "system", content: SYSTEM },
          { role: "user", content: `Sökord: "${query}". Identifiera parfymen och returnera metadata via verktyget.` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_perfume" } },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI gateway error", resp.status, text);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "För många förfrågningar, försök igen om en stund." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Krediter slut för Lovable AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI-tjänsten är inte tillgänglig" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Kunde inte hitta parfymen" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ perfume: parsed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lookup-perfume error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Okänt fel" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
