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

Set `GEMINI_API_KEY` in `.env.local` to enable the Gemini-powered summaries.

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
4. **(Optional) Configure AI summaries** – create `.env.local` at the repo root with your Gemini key
   ```bash
   echo "GEMINI_API_KEY=your-key-here" > .env.local
   ```
5. **Start the dev server**
   ```bash
   npm run dev
   ```
   Vite prints the URL (usually http://localhost:5173). Open it in your browser.
6. **(Optional) Production sanity check** – build and preview the optimized bundle
   ```bash
   npm run build
   npm run preview
   ```
   This runs the Vite production build and serves it locally for validation.
7. **(Optional) Clear local data** – if you want a clean slate between test runs, clear localStorage in your browser devtools or use the in-app full reset option.

## Gameplay flow at a glance

The core loop progresses through clearly defined phases for each grand prix weekend and the off-season. Key stage constants live in `types.ts` (`GamePhase` and `OffSeasonPhase`), and the primary UI routing occurs inside `App.tsx`.

- **Team selection and setup** – choose a team, set season length, and pick the next track to start the weekend.
  - The chosen calendar length (full or short) now persists when you advance to the next season; resetting standings restores the full calendar.
- **Practice → Qualifying → Racing** – weather-aware simulations, incidents, and tyre strategy flow through the practice starter (`handleStartPracticeWeekend`) into qualifying and the live race view before results are processed.
- **AI race summary / season review** – Gemini-backed race summaries and end-of-season reviews are triggered after each event to add flavor text and context for what just happened.
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
- **Post-race AI storytelling** – `handleProceedToOffSeason` and `generateAiSeasonReview` combine standings, constructor results, and personnel snapshots to build an end-of-season review before the off-season screens unlock.
- **Season reset / carryover** – `handleStartNewSeason` updates driver career history, regenerates rookies, resets standings/indices, and reinitializes many accumulators. Because this logic is centralized, any missed state reset or data mismatch can block advancing to the next season.

## Known stability hotspots

- The entire game loop lives in a single, ~2000-line `App.tsx` file. Season transitions, off-season phases, and race/weekend resets all mutate shared state; regressions often stem from missing resets or stale references.
- Season-to-season continuity is fragile: onboarding new entrants (e.g., Cadillac), repopulating rookies, and resetting race/qualifying/practice caches all occur in `handleStartNewSeason`. Any overlooked state (tracks, finances, AI summaries, shortlist data, etc.) can leave the simulation in an inconsistent state when starting the following year.
- `App.tsx` at the repository root is the single entry point referenced by `index.tsx`, removing the previous duplication under `src/`.

Use this README as a map while you audit the off-season and season-reset code paths to locate and fix the deep bugs preventing progression to the next year.
