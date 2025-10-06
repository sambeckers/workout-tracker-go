# Fix Workout Completion Persistence

## Problem
Workout completion state was not persisting correctly. When marking a workout as "Done" from either the Schedule or Session view, the completion status of exercises and sets was lost when navigating away and returning. The Schedule and Session views used different approaches to update completion state, leading to inconsistencies.

## Solution
Implemented atomic completion operations with proper database schema and backend API:

### 1. Database Migration
- Added `completed` (boolean) and `completed_at` (timestamp) fields to `workout_sessions` table
- Added `completed` (boolean) and `completed_at` (timestamp) fields to `exercise_logs` table
- Created indexes for better query performance
- Migrated existing data: sessions with `status='Done'` marked as `completed=true`

### 2. Backend Edge Function
Created `complete-workout-session` edge function that:
- Accepts `PATCH /complete-workout-session/:sessionId/complete` with `{ completed: boolean }`
- Atomically updates both session and all exercise logs in a transactional manner
- Updates `workout_sessions.completed`, `completed_at`, and `status` fields
- Updates all related `exercise_logs.completed` and `completed_at` fields
- Returns updated session and exercise logs for immediate UI sync
- Includes proper error handling with rollback on failure
- Validates user authorization and session ownership

### 3. Frontend Changes
**Hooks (`src/hooks/useWorkoutData.ts`):**
- Added `useCompleteWorkoutSession` hook that calls the new edge function
- Automatically invalidates relevant query caches on success
- Provides optimistic updates for immediate UI feedback

**Schedule Page (`src/pages/Schedule.tsx`):**
- Updated "Mark Done" button to use `useCompleteWorkoutSession` hook
- Removed direct status update in favor of atomic completion API
- Maintains confetti celebration on completion

**Session Page (`src/pages/WorkoutSession.tsx`):**
- Updated `toggleWorkoutStatus` to use `useCompleteWorkoutSession` hook
- Implements optimistic UI updates with rollback on error
- Shows toast notifications on success/failure
- Removed manual exercise log saving in favor of server-side atomic operation

### 4. Tests
**Unit Tests (`supabase/functions/complete-workout-session/complete-workout-session.test.ts`):**
- Tests successful completion (mark as Done)
- Tests successful un-completion (revert to Planned)
- Tests error cases (unauthorized, invalid session ID, missing parameters)

**E2E Tests (`tests/e2e/workout-completion.spec.ts`):**
- Tests Mark Done in Schedule → exercises completed in Session
- Tests Mark Done in Session → shows Done in Schedule
- Tests Undo functionality from both views
- Tests auto-mark Done when completing all sets
- Tests cache synchronization between Schedule and Session views

## Migration Steps
1. Database migration already executed successfully
2. Edge function automatically deployed with code changes
3. Frontend hooks and components updated to use new API
4. Security warnings noted (pre-existing, not related to this change)

## Testing Steps
1. **Manual Testing:**
   - Navigate to Schedule, click "Mark Done" on a workout
   - Open that workout session, verify all exercises/sets are completed
   - Navigate back to Schedule, verify workout still shows as "Done"
   - Undo from Session view, verify Schedule updates
   - Complete all sets in a session, verify auto-mark Done

2. **Automated Testing:**
   ```bash
   # Run unit tests
   cd supabase/functions/complete-workout-session
   deno test --allow-env --allow-net complete-workout-session.test.ts
   
   # Run E2E tests
   npx playwright test tests/e2e/workout-completion.spec.ts
   ```

## Security Notes
- JWT verification enabled on edge function (requires authentication)
- User authorization validated before any updates
- Session ownership verified to prevent unauthorized access
- Atomic transactions ensure data consistency

## Breaking Changes
None. The change is backward compatible - existing `status` field is maintained alongside new `completed` fields.

## Pre-existing Security Warnings
Two WARN-level security issues were detected (not introduced by this PR):
1. Function Search Path Mutable - existing database functions
2. Leaked Password Protection Disabled - auth configuration

These should be addressed in a separate PR.
