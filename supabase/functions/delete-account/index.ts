// Deletes the authenticated user's account and all related data.
// Blocks deletion if there is an active Stripe subscription.

import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Check for active Stripe subscriptions across both environments.
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_subscription_id, environment, status, cancel_at_period_end")
      .eq("user_id", userId);

    for (const sub of subs ?? []) {
      // Anything that could still be billing — block.
      const billable = ["active", "trialing", "past_due", "unpaid"].includes(sub.status);
      if (!billable) continue;
      try {
        const stripe = createStripeClient(sub.environment as StripeEnv);
        const remote = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        if (
          ["active", "trialing", "past_due", "unpaid"].includes(remote.status) &&
          !remote.cancel_at_period_end
        ) {
          return new Response(
            JSON.stringify({
              error: "active_subscription",
              message:
                "You have an active premium subscription. Please cancel it from 'Manage' on your profile before deleting your account.",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      } catch (e) {
        console.error("Stripe lookup failed:", e);
        // Fail closed — refuse deletion if we can't verify.
        return new Response(
          JSON.stringify({
            error: "subscription_check_failed",
            message: "Could not verify your subscription status. Please try again later.",
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Delete all user-owned rows. RLS-tables with ON DELETE CASCADE on auth.users
    // would clean up automatically, but we do it explicitly to be safe.
    await supabaseAdmin.from("scans").delete().eq("user_id", userId);
    await supabaseAdmin.from("taste_profile").delete().eq("user_id", userId);
    await supabaseAdmin.from("manual_premium_grants").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("subscriptions").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // Finally delete the auth user.
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("auth.admin.deleteUser failed:", delErr);
      return new Response(
        JSON.stringify({ error: "delete_failed", message: delErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("delete-account error:", e);
    return new Response(JSON.stringify({ error: "internal_error", message: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
