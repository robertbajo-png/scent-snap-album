# ScentSnap — Android (Capacitor) build guide

This guide explains how to package ScentSnap as an Android app and publish it
to Google Play.

## How it works

The Android app is a thin Capacitor shell that loads the live site
(`https://scent-snap-album.lovable.app`) directly inside an Android WebView via
`server.url` in `capacitor.config.ts`. This means:

- One codebase — same TanStack Start SSR app powers web and Android.
- Web updates published in Lovable are picked up by the Android app on next
  launch (no Play Store release required).
- A new signed `.aab` is only needed when you change native code, plugins,
  icons, splash screen, or the `appId`.

## One-time prerequisites (your machine)

1. **Node + bun** — already needed for web development.
2. **Java JDK 17** — required by modern Android Gradle Plugin.
   - macOS: `brew install --cask temurin@17`
   - Linux: `sudo apt install openjdk-17-jdk`
   - Windows: install from https://adoptium.net/temurin/releases/ (JDK 17)
3. **Android Studio** — https://developer.android.com/studio
   - Open it once, install the recommended SDK + Platform tools.
   - In Settings → Languages & Frameworks → Android SDK, install:
     - Android SDK Platform 34 (or latest)
     - Android SDK Build-Tools 34+
     - Android SDK Command-line Tools
4. **Google Play Developer account** — $25 one-time, https://play.google.com/console

## First-time project setup

Clone the repo and install dependencies:

```bash
git clone <your-repo-url> scentsnap
cd scentsnap
bun install
```

Generate the native Android project (only run once — the `android/` folder is
created locally and not committed):

```bash
bun run cap:prepare         # creates dist/client/index.html placeholder
bunx cap add android        # creates ./android/
bun run cap:sync            # syncs plugins + placeholder into android/
```

> The `android/` folder is intentionally **not** included in this repo. Each
> developer/machine generates it locally with `cap add android`.

## Daily build loop

The Android app loads its UI from the live site, so you do **not** need to run
`bun run build` before syncing. Just sync plugins and open Android Studio:

```bash
bun run cap:sync            # placeholder + cap sync android
bunx cap open android       # opens Android Studio
```

In Android Studio:

- Press the green ▶ Run button to launch on a connected device or emulator.
- The app should open and display the live ScentSnap login screen.
- For a release build: **Build → Generate Signed Bundle / APK → Android App
  Bundle (.aab)**.

> Frontend changes you make in Lovable go live the moment you publish — open
> the app and they're there. You only rebuild the `.aab` for native changes
> (plugins, icons, splash, appId, version bump for Play Store updates).

## Signing the release build

Google Play requires an **AAB** (Android App Bundle) signed with an upload key.

1. In Android Studio: Build → Generate Signed Bundle / APK → Android App Bundle.
2. Click "Create new..." to generate a keystore.
   - Store the `.keystore` file somewhere safe (NOT in the repo).
   - Save the keystore password, key alias, and key password in a password
     manager. **If you lose them you cannot publish updates.**
3. Choose `release` build variant and finish.
4. The signed `.aab` lands in `android/app/build/outputs/bundle/release/`.

## Publishing to Google Play

1. Go to https://play.google.com/console → Create app.
2. Fill in store listing: title, short description, full description, screenshots
   (at least 2, 16:9 or 9:16), feature graphic (1024×500), app icon.
3. Content rating questionnaire, target audience, data safety form.
4. Production → Create new release → upload the signed `.aab`.
5. Review and roll out.

First reviews typically take 1–7 days.

## Important: payments on Android

Google Play requires that **digital subscriptions sold inside the app go
through Google Play Billing**, not Stripe. The plan is to wire this up in
Phase 2 (`docs/play-billing.md` will be added then). Until then, the upgrade
flow on Android should be hidden behind `Capacitor.isNativePlatform()` or
shipped as free-only.

## App identity

- **Application ID**: `app.lovable.scentsnap` (set in `capacitor.config.ts`)
- **Display name**: ScentSnap
- **Live URL loaded by WebView**: `https://scent-snap-album.lovable.app`
- Change any of these by editing `capacitor.config.ts` and re-running
  `bun run cap:sync`. The `applicationId` in `android/app/build.gradle` should
  match the `appId`.

## Troubleshooting

- **"dist/client/index.html not found"** during `cap sync` — run
  `bun run cap:prepare` first (or just use `bun run cap:sync` which does both).
- **App opens to a white screen** — check that `https://scent-snap-album.lovable.app`
  actually loads in a normal browser, and that the device/emulator has
  internet. Look at `chrome://inspect` on a desktop Chrome to remote-debug
  the WebView.
- **Login doesn't persist** — confirm `server.androidScheme: "https"` is set
  in `capacitor.config.ts` so cookies share origin with the live site.
