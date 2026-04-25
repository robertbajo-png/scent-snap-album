import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.scentsnap",
  appName: "ScentSnap",
  // Required field, but unused at runtime when `server.url` is set.
  // We still need a placeholder file so `cap sync` doesn't error.
  webDir: "dist/client",
  server: {
    // The Android app loads the live site directly inside the WebView.
    // This avoids having to bundle a static SPA build (the app is SSR on
    // Cloudflare Workers and never produces a single index.html).
    url: "https://scent-snap-album.lovable.app",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0a0a0a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0a",
    },
  },
};

export default config;
