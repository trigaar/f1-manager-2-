# F1 Manager 2 (Prototype)

An ultra-detailed, season-by-season Formula 1 management simulation. The app guides you through selecting a team, running practice/qualifying/race weekends, generating AI commentary/reviews, and moving into a multi-step off-season that reshapes the grid for the next year.

## Quickstart

**Prerequisites**

- Node.js **18+** (ensure `node -v` reports >= 18)
- npm (bundled with Node)

```bash
npm install
npm run dev
```

### Local setup (step-by-step)

1. **Clone and enter the repo**
   ```bash
   git clone <repo-url>
   cd f1-manager-2-
   ```
2. **Verify Node version** (upgrade if needed so you are on 18+)
   ```bash
   node -v
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Start the dev server**
   ```bash
   npm run dev
   ```
   Vite prints the URL (usually http://localhost:5173). Open it in your browser.
5. **(Optional) Production sanity check** – build and preview the optimized bundle
   ```bash
   npm run build
   npm run preview
   ```
   This runs the Vite production build and serves it locally for validation.
6. **(Optional) Clear local data** – if you want a clean slate between test runs, clear localStorage in your browser devtools or use the in-app full reset option.

## Gameplay flow at a glance

The core loop progresses through clearly defined phases for each grand prix weekend and the off-season. Key stage constants live in `src/types.ts` (`GamePhase` and `OffSeasonPhase`), and the primary UI routing occurs inside `App.tsx`.

- **Team selection and setup** – choose a team, set season length, and pick the next track to start the weekend.
  - The chosen calendar length (full or short) now persists when you advance to the next season; resetting standings restores the full calendar.
- **Practice → Qualifying → Racing** – weather-aware simulations, incidents, and tyre strategy flow through the practice starter (`handleStartPracticeWeekend`) into qualifying and the live race view before results are processed.
- **Race summary / season review** – local generators assemble post-race summaries and season reviews after each event to add flavor text and context for what just happened without any external API keys.
- **Off-season pipeline** – a series of screens handles debriefs, driver progression, finances, resource allocation, staffing, the driver market, regulations, and car development before a new year begins.

## Project structure

- **`App.tsx`** – monolithic state container that coordinates every phase (weekend setup, sessions, AI summaries, and the off-season) and renders the appropriate screen component per phase.
- **`components/`** – React screens for each phase: setup, practice/qualifying, race overlays, AI summaries, and all off-season modules (financials, staffing, driver market, regulation changes, car development, etc.).
- **`services/`** – pure logic modules for strategy, incidents, qualifying, weather, finances, personnel, driver market, car development, progression, and AI text generation.
- **`constants/`** – static data for tracks, tyres, drivers, personnel, cars, and palette values.
- **`hooks/`** – derived-state helpers for standings, constructor standings, race history, and season history.
- **`types.ts`** – shared domain models covering cars, drivers, tyres, tracks, weather, game/off-season phases, and financial constructs.

## Key systems to be aware of

- **Race weekend setup** – `handleStartPracticeWeekend` initializes the selected track, adjusts car ratings for technical directives, seeds weather forecasts, and runs practice simulation before moving to qualifying. The surrounding state (roster form, track temperatures, and forecasts) feeds directly into later sessions.
- **Post-race storytelling** – `handleProceedToOffSeason` and `generateAiSeasonReview` combine standings, constructor results, and personnel snapshots to build an end-of-season review before the off-season screens unlock.
- **Season reset / carryover** – `handleStartNewSeason` updates driver career history, regenerates rookies, resets standings/indices, and reinitializes many accumulators. Because this logic is centralized, any missed state reset or data mismatch can block advancing to the next season.

## Known stability hotspots

- The entire game loop lives in a single, ~2000-line `App.tsx` file. Season transitions, off-season phases, and race/weekend resets all mutate shared state; regressions often stem from missing resets or stale references.
- Season-to-season continuity is fragile: onboarding new entrants (e.g., Cadillac), repopulating rookies, and resetting race/qualifying/practice caches all occur in `handleStartNewSeason`. Any overlooked state (tracks, finances, AI summaries, shortlist data, etc.) can leave the simulation in an inconsistent state when starting the following year.
- There are two `App.tsx` files (one at repo root referenced by `index.tsx`, and another under `src/`). Aligning to a single source of truth will reduce confusion when patching season-flow bugs.

Use this README as a map while you audit the off-season and season-reset code paths to locate and fix the deep bugs preventing progression to the next year.

## Ship to Android via Trusted Web Activity (Option B)

The game is a pure static build with no external APIs, so it can ship to Google Play as a Trusted Web Activity (TWA) with only hosting and a thin Android wrapper.

### 1) Prep the web bundle
- Build locally: `npm install && npm run build` (outputs `dist/`).
- The manifest now references only the vector icon (`/icon.svg`) to avoid binary assets. Host the following at your domain root:
  - `https://your-domain/manifest.json`
  - `https://your-domain/icon.svg`
  The manifest declares `start_url: "/"`, `display: "standalone"`, and theme colors for TWA/PWA shells.
- Deploy `dist/` to your host (Vercel, Netlify, Cloudflare Pages, etc.) so the site is reachable at `https://your-domain` without needing PNG uploads that some git frontends reject as binaries.

### 2) Prove site ownership (Digital Asset Links)
- Create `.well-known/assetlinks.json` on your host. A template lives at `public/.well-known/assetlinks.sample.json`; copy/rename it to `assetlinks.json` and replace the package name plus the SHA-256 fingerprint of your release key.
- This file lets Chrome trust the relationship between the web origin and the Play Store app.

### 3) Generate the TWA shell with Bubblewrap
- Install tooling: `npm install -g @bubblewrap/cli`.
- Initialize from your hosted manifest: `bubblewrap init --manifest=https://your-domain/manifest.json`.
- When prompted, set the package ID to match the value you used in `assetlinks.json`.
- Build the Android App Bundle: `bubblewrap build` (or `bubblewrap build --skipPwaValidation` while iterating).

### 4) Test and publish
- Open the generated Android project in Android Studio to run on an emulator/device and confirm the TWA launches the hosted site cleanly.
- Create a signing key if you do not have one, then produce a release `.aab`.
- In Play Console, create the app listing, upload the `.aab`, add screenshots/content rating/privacy policy, and roll out to a closed test or production.

### Update cadence
- When the web app changes, redeploy `dist/` to your host and rerun `bubblewrap build` to ship an updated `.aab`. The Android shell remains minimal because all logic lives in the web bundle.
