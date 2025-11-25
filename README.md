# F1 Manager 2 (Prototype)

An ultra-detailed, season-by-season Formula 1 management simulation. The app guides you through selecting a team, running practice/qualifying/race weekends, generating AI commentary/reviews, and moving into a multi-step off-season that reshapes the grid for the next year.

## Quickstart

**Prerequisite:** Node.js 18+

```bash
npm install
npm run dev
```

Set `GEMINI_API_KEY` in `.env.local` to enable the Gemini-powered summaries.

### Run the app locally (full steps)

1. **Install dependencies** (from the repo root):
   ```bash
   npm install
   ```
2. **Create environment file** if you want AI summaries:
   ```bash
   echo "GEMINI_API_KEY=your-key-here" > .env.local
   ```
3. **Start the dev server**:
   ```bash
   npm run dev
   ```
   Vite will print a localhost URL (default http://localhost:3000). Open it in your browser.
4. **Production sanity check** (optional):
   ```bash
   npm run build
   npm run preview
   ```
   This runs the Vite production build and serves it locally for validation.

## Gameplay flow at a glance

The core loop progresses through clearly defined phases for each grand prix weekend and the off-season. Key stage constants live in `src/types.ts` (`GamePhase` and `OffSeasonPhase`), and the primary UI routing occurs inside `App.tsx`.

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
- There are two `App.tsx` files (one at repo root referenced by `index.tsx`, and another under `src/`). Aligning to a single source of truth will reduce confusion when patching season-flow bugs.

Use this README as a map while you audit the off-season and season-reset code paths to locate and fix the deep bugs preventing progression to the next year.
