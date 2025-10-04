# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5593e382-46d1-46e9-9c3e-eca2d14491ee

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5593e382-46d1-46e9-9c3e-eca2d14491ee) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

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

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5593e382-46d1-46e9-9c3e-eca2d14491ee) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

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

Progression Suggestions (internal): Logic scaffolding is in place to surface lightweight suggestions (e.g., +2.5% load, -2% pace). These can be surfaced in the UI later.

Implementation Highlights:
- Central metric classification utility: `src/lib/metrics.ts`
- Progressive defaults derivation: `deriveProgressiveDefaults()`
- Exercise prefill integration inside `WorkoutPlanner` confirm add flow
- Reusable chart component: `ExerciseProgressChart` with mode toggles

Limitations / Next Ideas:
- Surface suggestions directly under exercise inputs
- Allow user preference for default chart mode (volume vs weight, pace vs distance)
- Personal best markers & trend percentage badges
