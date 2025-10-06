/**
 * E2E tests for workout completion persistence
 * 
 * Tests that marking a workout as Done/Planned correctly updates
 * the session and all exercises/sets, and that the state persists
 * when navigating away and returning.
 * 
 * Run with: npx playwright test tests/e2e/workout-completion.spec.ts
 */

import { test, expect } from '@playwright/test';

// Helper to login before each test
async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'testpassword123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

test.describe('Workout Completion Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Mark Done in Schedule → exercises should be completed when opening session', async ({ page }) => {
    // Navigate to Schedule
    await page.goto('/dashboard/schedule');
    await expect(page.locator('h1')).toContainText('Workout Schedule');

    // Find a planned workout and click Mark Done
    const firstWorkout = page.locator('[data-testid="workout-card"]').first();
    const markDoneButton = firstWorkout.locator('button:has-text("Mark Done")');
    
    // If no planned workout exists, create one first
    if (await markDoneButton.count() === 0) {
      await page.click('button:has-text("Plan Workout")');
      await page.waitForURL('/dashboard/workout/plan');
      // Add a simple workout
      await page.fill('input[placeholder*="workout title"]', 'Test Workout');
      await page.click('button:has-text("Save")');
      await page.goto('/dashboard/schedule');
    }

    // Click Mark Done
    await markDoneButton.click();
    
    // Verify button changes to "Done"
    await expect(firstWorkout.locator('button:has-text("Done")')).toBeVisible();

    // Open the session
    await firstWorkout.locator('button:has-text("Open Session")').click();
    await page.waitForURL(/\/dashboard\/workout\/.*/);

    // Verify all exercises and sets are marked as completed
    const exerciseCards = page.locator('[data-testid="exercise-card"]');
    const count = await exerciseCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = exerciseCards.nth(i);
      const completedSets = card.locator('[data-completed="true"]');
      // Verify at least some sets are marked completed
      expect(await completedSets.count()).toBeGreaterThan(0);
    }

    // Verify session status is Done
    await expect(page.locator('button:has-text("Done")')).toBeVisible();
  });

  test('Mark Done in Session → navigate to Schedule → workout should show as Done', async ({ page }) => {
    // Navigate to a workout session (create or use existing)
    await page.goto('/dashboard/workout/quick');
    await page.fill('input[placeholder*="workout title"]', 'Quick Test Session');
    
    // Add an exercise
    await page.click('button:has-text("Add Exercise")');
    const firstExercise = page.locator('[data-testid="exercise-select"]').first();
    await firstExercise.click();
    
    // Mark the workout as Done
    await page.click('button:has-text("Mark Done")');
    await expect(page.locator('button:has-text("Done")')).toBeVisible();
    
    // Navigate back to Schedule
    await page.goto('/dashboard/schedule');
    
    // Find the workout we just completed
    const completedWorkout = page.locator('text=Quick Test Session').locator('..');
    
    // Verify it shows as Done
    await expect(completedWorkout.locator('button:has-text("Done")')).toBeVisible();
    
    // Verify badge shows "Done"
    await expect(completedWorkout.locator('[class*="bg-green"]')).toContainText('Done');
  });

  test('Undo Done → exercises and session should revert to incomplete', async ({ page }) => {
    // Navigate to Schedule and find a Done workout
    await page.goto('/dashboard/schedule');
    
    const doneWorkout = page.locator('button:has-text("Done")').first().locator('..');
    
    // Click Done to undo
    await doneWorkout.locator('button:has-text("Done")').click();
    
    // Verify button changes to "Mark Done"
    await expect(doneWorkout.locator('button:has-text("Mark Done")')).toBeVisible();
    
    // Open the session
    await doneWorkout.locator('button:has-text("Open Session")').click();
    await page.waitForURL(/\/dashboard\/workout\/.*/);
    
    // Verify exercises are not completed
    const exerciseCards = page.locator('[data-testid="exercise-card"]');
    const count = await exerciseCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = exerciseCards.nth(i);
      const incompleteSets = card.locator('[data-completed="false"]');
      // Verify sets are marked as incomplete
      expect(await incompleteSets.count()).toBeGreaterThan(0);
    }
    
    // Verify session status is Planned
    await expect(page.locator('button:has-text("Mark Done")')).toBeVisible();
  });

  test('Completing all sets → session automatically marks as Done', async ({ page }) => {
    // Navigate to a workout session with exercises
    await page.goto('/dashboard/workout/quick');
    await page.fill('input[placeholder*="workout title"]', 'Auto Complete Test');
    
    // Add an exercise with 3 sets
    await page.click('button:has-text("Add Exercise")');
    const firstExercise = page.locator('[data-testid="exercise-select"]').first();
    await firstExercise.click();
    
    // Complete all sets
    const sets = page.locator('[data-testid="set-checkbox"]');
    const setCount = await sets.count();
    
    for (let i = 0; i < setCount; i++) {
      await sets.nth(i).check();
    }
    
    // Wait for auto-save and auto-mark
    await page.waitForTimeout(2000);
    
    // Verify session is automatically marked as Done
    await expect(page.locator('button:has-text("Done")')).toBeVisible();
    
    // Navigate away and return
    await page.goto('/dashboard/schedule');
    await page.goBack();
    
    // Verify state persisted
    await expect(page.locator('button:has-text("Done")')).toBeVisible();
    
    // Verify sets are still completed
    for (let i = 0; i < setCount; i++) {
      await expect(sets.nth(i)).toBeChecked();
    }
  });

  test('Schedule and Session buttons use same API → both update caches', async ({ page }) => {
    // Create a workout and mark it done from Schedule
    await page.goto('/dashboard/schedule');
    await page.click('button:has-text("Plan Workout")');
    await page.fill('input[placeholder*="workout title"]', 'Cache Test Workout');
    await page.click('button:has-text("Save")');
    await page.goto('/dashboard/schedule');
    
    const workout = page.locator('text=Cache Test Workout').locator('..');
    await workout.locator('button:has-text("Mark Done")').click();
    
    // Open session immediately
    await workout.locator('button:has-text("Open Session")').click();
    await page.waitForURL(/\/dashboard\/workout\/.*/);
    
    // Verify session shows Done (cache was updated)
    await expect(page.locator('button:has-text("Done")')).toBeVisible();
    
    // Undo from Session view
    await page.click('button:has-text("Done")');
    await expect(page.locator('button:has-text("Mark Done")')).toBeVisible();
    
    // Go back to Schedule
    await page.goto('/dashboard/schedule');
    
    // Verify Schedule shows Planned (cache was updated)
    await expect(workout.locator('button:has-text("Mark Done")')).toBeVisible();
  });
});
