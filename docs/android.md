# ScentSnap — Android (Capacitor) build guide

This guide explains how to package ScentSnap as an Android app and publish it
to Google Play. The web app continues to run unchanged at
https://scent-snap-album.lovable.app — Capacitor just wraps the same web bundle
inside a native Android shell.

## One-time prerequisites (your machine)

1. **Node + bun** — already needed for web development.
2. **Java JDK 17** — required by modern Android Gradle Plugin.
   - macOS: `brew install --cask temurin@17`
   - Linux: `sudo apt install openjdk-17-jdk`
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
checked in after this step):

```bash
bun run build               # produces dist/client (the webDir)
bunx cap add android        # creates ./android/
bunx cap sync android       # copies web assets + plugins into android/
```

> The `android/` folder is intentionally **not** included in this repo. Each
> developer/machine generates it locally with `cap add android`.

## Daily build loop

After you change web code:

```bash
bun run build
bunx cap sync android       # copies the fresh dist/client into android/
bunx cap open android       # opens Android Studio
```

In Android Studio:

- Press the green ▶ Run button to launch on a connected device or emulator.
- For a release build: **Build → Generate Signed Bundle / APK → Android App
  Bundle (.aab)**.

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
   (at least 2, 16:9 or 9:16), feature graphic (1024×500), app icon (already
   bundled).
3. Content rating questionnaire, target audience, data safety form.
4. Production → Create new release → upload the signed `.aab`.
5. Review and roll out.

First reviews typically take 1–7 days.

## Important: payments on Android

Google Play requires that **digital subscriptions sold inside the app go
through Google Play Billing**, not Stripe. This project still uses Stripe for
the web. The Android Play Billing integration is wired up in a separate phase
(see `docs/play-billing.md` once added) — until then, the Android build should
either:

- hide the upgrade flow on `Capacitor.isNativePlatform()`, or
- ship as a free app and direct users to the website to upgrade (without
  linking — Google's policy is strict).

## App identity

- **Application ID**: `app.lovable.scentsnap` (set in `capacitor.config.ts`)
- **Display name**: ScentSnap
- Change either by editing `capacitor.config.ts` and re-running
  `bunx cap sync android`. The applicationId in `android/app/build.gradle`
  should match.
