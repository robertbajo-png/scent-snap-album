/**
 * Native (Capacitor) bootstrap. Runs once on the client.
 *
 * - Sets dark status bar to match the app theme.
 * - Hides the splash screen as soon as React has mounted.
 * - Wires the Android hardware back button to browser-style history navigation
 *   (and exits the app when there is no history left).
 *
 * Safe no-op on web — `Capacitor.isNativePlatform()` returns false there and
 * the dynamic imports never resolve to the platform-specific code paths.
 */
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

/**
 * SSR-safe check for whether we are running inside the Capacitor native shell
 * (Android/iOS app), as opposed to a regular browser. Returns false during
 * SSR and on the web.
 */
export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    // ignore — fall through to dev override check
  }

  // Dev override: allow forcing the native UI in a regular browser by
  // visiting the app with `?native=1` once. The flag is persisted to
  // localStorage so subsequent navigations (which TanStack Router may
  // strip from the query string) keep the override active.
  // Use `?native=0` to clear the override.
  try {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("native");
    if (flag === "1") {
      window.localStorage.setItem("force-native", "1");
      return true;
    }
    if (flag === "0") {
      window.localStorage.removeItem("force-native");
      return false;
    }
    return window.localStorage.getItem("force-native") === "1";
  } catch {
    return false;
  }
}

/**
 * SSR/hydration-safe React hook for the native check. Always returns `false`
 * on the first render (matching the SSR HTML), then re-renders with the real
 * value after mount. Use this in components — calling `isNativePlatform()`
 * directly during render causes a hydration mismatch (React error #418)
 * because the server renders `false` and the client may render `true`.
 */
export function useIsNative(): boolean {
  const [native, setNative] = useState(false);
  useEffect(() => {
    setNative(isNativePlatform());
  }, []);
  return native;
}

let initialized = false;

export async function initNative(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (typeof window === "undefined") return;
  if (!Capacitor.isNativePlatform()) return;

  try {
    const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
      import("@capacitor/app"),
    ]);

    // Status bar — dark style with our background color.
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    await StatusBar.setBackgroundColor({ color: "#0a0a0a" }).catch(() => {});

    // Hide splash once mounted.
    await SplashScreen.hide().catch(() => {});

    // Hardware back button → go back in history, exit if nothing to pop.
    App.addListener("backButton", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        App.exitApp().catch(() => {});
      }
    });
  } catch (err) {
    // Don't crash the web bundle if a plugin fails to load.
    console.warn("Native init skipped:", err);
  }
}
