import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Du är en parfymexpert. Baserat på användarens smakprofil och scanninghistorik, föreslå 6 parfymer på svenska.
Varje förslag ska vara verklig och välkänd. Förklara kort varför den passar (1-2 meningar).
Returnera ALLTID via verktyget 'return_recommendations'.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tasteProfile, recentScans } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const tool = {
      type: "function",
      function: {
        name: "return_recommendations",
        description: "Returnera parfymrekommendationer",
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

    const userMsg = `Smakprofil: ${JSON.stringify(tasteProfile ?? {})}
Senaste scanningar: ${JSON.stringify((recentScans ?? []).slice(0, 10))}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_recommendations" } },
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Okänt fel" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
