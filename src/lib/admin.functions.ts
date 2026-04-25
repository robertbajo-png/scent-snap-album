import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const checkIsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

export const searchUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ query: z.string().min(1).max(255) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    // Search auth users by email (paginated; small projects so 100 is enough)
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw new Error(error.message);

    const q = data.query.toLowerCase();
    const matches = list.users.filter((u) =>
      (u.email ?? "").toLowerCase().includes(q),
    );

    const ids = matches.map((u) => u.id);
    if (ids.length === 0) return { users: [] };

    const [{ data: roles }, { data: grants }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin
        .from("manual_premium_grants")
        .select("user_id, expires_at")
        .in("user_id", ids),
    ]);

    return {
      users: matches.map((u) => {
        const grant = grants?.find((g) => g.user_id === u.id);
        return {
          id: u.id,
          email: u.email ?? "",
          isAdmin: Boolean(roles?.find((r) => r.user_id === u.id && r.role === "admin")),
          hasGrant: Boolean(grant),
          grantExpiresAt: grant?.expires_at ?? null,
        };
      }),
    };
  });

export const listPremiumUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const { data: grants } = await supabaseAdmin
      .from("manual_premium_grants")
      .select("user_id, granted_at, expires_at, note")
      .order("granted_at", { ascending: false });

    const ids = grants?.map((g) => g.user_id) ?? [];
    if (ids.length === 0) return { users: [] };

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    const emailById = new Map(list?.users.map((u) => [u.id, u.email ?? ""]) ?? []);

    return {
      users:
        grants?.map((g) => ({
          id: g.user_id,
          email: emailById.get(g.user_id) ?? "(unknown)",
          grantedAt: g.granted_at,
          expiresAt: g.expires_at,
          note: g.note,
        })) ?? [],
    };
  });

export const grantPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      expiresAt: z.string().datetime().nullable().optional(),
      note: z.string().max(500).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { error } = await supabaseAdmin.from("manual_premium_grants").upsert({
      user_id: data.userId,
      granted_by: context.userId,
      expires_at: data.expiresAt ?? null,
      note: data.note ?? null,
      granted_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const revokePremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { error } = await supabaseAdmin
      .from("manual_premium_grants")
      .delete()
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid(), makeAdmin: z.boolean() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    if (data.makeAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      // Don't let an admin remove their own admin role (avoid lockout)
      if (data.userId === context.userId) {
        throw new Error("You cannot remove your own admin role.");
      }
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { success: true };
  });
