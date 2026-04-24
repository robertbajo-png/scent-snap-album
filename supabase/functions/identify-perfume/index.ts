import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are a world-class perfume expert (parfymör/fragrance reviewer) inspired by sources like Fragrantica.
Given a photo of a perfume bottle, label or packaging, identify the perfume and return rich, accurate metadata in Swedish.

Rules:
- If you cannot read the bottle clearly, still make an educated guess based on visual style and explain confidence.
- Notes (top/heart/base) must be specific (e.g. "Bergamott", "Iris", "Sandelträ", "Ambroxan"). 3-6 per layer.
- Accords are broad olfactory families with intensity 0-100 (e.g. "Träig", "Blommig", "Orientalisk", "Citrus", "Gourmand", "Chypré", "Fougère", "Aquatic", "Mossig", "Pudrig").
- longevity & sillage: 1-5 (1=svag, 5=mycket stark).
- gender: "Herr" | "Dam" | "Unisex".
- Description: 2-4 meningar, evokativ och konkret, på svenska.
- similar_perfumes: 3 förslag med {brand, name, why}.
- confidence: 0-1.
- Always respond by calling the tool 'return_perfume'.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!imageBase64 && !imageUrl) throw new Error("imageBase64 or imageUrl required");

    const userContent: any[] = [
      { type: "text", text: "Identifiera denna parfym och returnera all metadata via verktyget." },
      {
        type: "image_url",
        image_url: { url: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : imageUrl },
      },
    ];

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
            "brand", "name", "description",
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
          { role: "user", content: userContent },
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
        return new Response(JSON.stringify({ error: "Krediter slut för Lovable AI. Lägg till krediter i workspace." }), {
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
      console.error("No tool call returned", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Kunde inte tolka parfymen" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ perfume: parsed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("identify-perfume error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Okänt fel" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
