# Workout Tracker Go

## Installation
If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Progressive Defaults & Per-Exercise Progress

The workout planner now auto-fills each newly added exercise with intelligent starting values:

- Strength: Last top-set weight, average reps, prior set count (or sensible defaults: 3 x 10 @ 20kg)
- Bodyweight: Last average reps (or 10)
- Cardio (distance + time): Last distance and duration (fallback 5km / 30min)
- Duration-only (plank / holds): Last duration (fallback 30–60s)

Additionally, each exercise displays a compact sparkline (toggleable metric when applicable):

- Strength: Max Weight (default) ↔ Volume toggle
- Cardio: Distance (default) ↔ Pace (min/km) toggle
- Bodyweight: Total Reps progression
- Duration: Duration (minutes)

Progression suggestions (internal): Logic scaffolding is in place to surface lightweight suggestions (e.g., +2.5% load, -2% pace). These can be surfaced in the UI later.

Implementation:
- Central metric classification utility: `src/lib/metrics.ts`
- Progressive defaults derivation: `deriveProgressiveDefaults()`
- Exercise prefill integration inside `WorkoutPlanner` confirm add flow
- Reusable chart component: `ExerciseProgressChart` with mode toggles
