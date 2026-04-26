import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { useAuth } from "@/lib/auth";
import { isNativePlatform } from "@/lib/native";

export const FREE_DAILY_LIMIT_WEB = 3;
export const FREE_DAILY_LIMIT_NATIVE = 5;

/**
 * Daily free-scan limit. On Android (Capacitor) we give users 5/day instead
 * of 3, since Google Play Billing isn't wired up yet — they can't upgrade
 * from inside the app, so a slightly higher limit avoids dead-ends.
 */
export const FREE_DAILY_LIMIT = isNativePlatform()
  ? FREE_DAILY_LIMIT_NATIVE
  : FREE_DAILY_LIMIT_WEB;

export interface QuotaState {
  loading: boolean;
  isPremium: boolean;
  scansToday: number;
  remaining: number;
  canScan: boolean;
  refresh: () => Promise<void>;
}

export function useQuota(): QuotaState {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [scansToday, setScansToday] = useState(0);

  const load = async () => {
    if (!user) {
      setLoading(false);
      setIsPremium(false);
      setScansToday(0);
      return;
    }
    setLoading(true);
    try {
      const env = getStripeEnvironment();
      const [subRes, countRes] = await Promise.all([
        supabase.rpc("has_active_subscription", { user_uuid: user.id, check_env: env }),
        supabase.rpc("get_daily_scan_count", { user_uuid: user.id }),
      ]);
      setIsPremium(Boolean(subRes.data));
      setScansToday(Number(countRes.data ?? 0));
    } catch (e) {
      console.error("useQuota error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Realtime: refresh on subscription changes for this user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const remaining = isPremium ? Infinity : Math.max(0, FREE_DAILY_LIMIT - scansToday);
  const canScan = isPremium || scansToday < FREE_DAILY_LIMIT;

  return { loading, isPremium, scansToday, remaining, canScan, refresh: load };
}
