/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * v4.1.0 one-time rename migration.
 * Rewrites exercise names in workouts, drafts, splits, and saved_splits so
 * historical data continues to match the renamed library entries.
 * Gated by userProfile.renameMigrationV1 so it only runs once per user.
 */
import { storage } from '@/src/services/storage';
import type { Workout, Split, SavedSplit, ExerciseEntry, ProgrammedExercise } from '@/src/types';

// Exact rename map. Keys are OLD names, values are NEW names.
// Order in the object doesn't matter for correctness since we only do a single
// lookup per exercise name, but we document the source-of-truth list here.
const RENAME_MAP: Record<string, string> = {
  'Flat Bench Press': 'Flat Barbell Bench Press',
  'Barbell Bench Press': 'Flat Barbell Bench Press',
  'Low-to-High Cable Flyes': 'Low to High Cable Flyes',
  'Single-Arm Cable Pushdowns': 'Single Arm Cable Pushdowns',
  'Close-Grip Bench Press': 'Close Grip Bench Press',
  'Behind-the-Back Wrist Curls': 'Behind the Back Wrist Curls',
  'Chest-Supported Row': 'Chest Supported Row',
  'T-Bar Row': 'T Bar Row',
  'Iso-Lateral Machine Rows': 'Iso Lateral Machine Rows',
  'ISO Lateral Low Rows': 'Iso Lateral Low Rows',
  'Pull-Up': 'Pull Ups',
  'Pull-Ups': 'Pull Ups',
  'Chin-Up': 'Chin Ups',
  'Single-Arm Lat Pulldown': 'Single Arm Lat Pulldown',
  'Straight-Arm Pulldown': 'Straight Arm Pulldown',
  '45-Degree Back Extension': '45 Degree Back Extension',
  'Step-Ups': 'Step Ups',
  'Incline DB Curls': 'Seated Incline DB Curls',
  'Single-Leg Curl': 'Single Leg Curls',
  'Stiff-Leg Deadlift': 'Stiff Leg Deadlift',
  'Cable Pull-Through': 'Cable Pull Throughs',
  'Single-Leg Calf Raises': 'Single Leg Calf Raises',
  'Decline Sit-Up': 'Decline Sit Ups',
  'Weighted Sit-Up': 'Weighted Sit Ups',
  'GHD Sit-Up': 'GHD Sit Ups',
};

function mapName(name: string | undefined): string | undefined {
  if (!name) return name;
  return RENAME_MAP[name] ?? name;
}

/**
 * Rewrite names inside an exercise entry (and its superset child if any).
 * Returns a new ExerciseEntry if anything changed, otherwise the same object.
 */
function rewriteExercise(ex: ExerciseEntry): { entry: ExerciseEntry; changed: boolean } {
  let changed = false;
  const next: ExerciseEntry = { ...ex };
  const newName = mapName(ex.name);
  if (newName !== ex.name) {
    next.name = newName!;
    changed = true;
  }
  if (ex.superset) {
    const sup = rewriteExercise(ex.superset as ExerciseEntry);
    if (sup.changed) {
      next.superset = sup.entry;
      changed = true;
    }
  }
  return { entry: next, changed };
}

/**
 * Rewrite names inside a programmed exercise (and its superset child if any).
 */
function rewriteProgrammed(ex: ProgrammedExercise): { entry: ProgrammedExercise; changed: boolean } {
  let changed = false;
  const next: ProgrammedExercise = { ...ex };
  const newName = mapName(ex.name);
  if (newName !== ex.name) {
    next.name = newName!;
    changed = true;
  }
  if (ex.superset && Array.isArray(ex.superset)) {
    const newSuperset = ex.superset.map(s => {
      const sup = rewriteProgrammed(s);
      if (sup.changed) changed = true;
      return sup.entry;
    });
    if (changed) {
      next.superset = newSuperset;
    }
  }
  return { entry: next, changed };
}

/**
 * Rewrite a single workout in-place. Returns [workout, changed] — if changed is
 * false the caller can skip the write.
 */
function rewriteWorkout(w: Workout): { workout: Workout; changed: boolean } {
  let changed = false;
  const next: Workout = { ...w };

  // Rewrite blocks[].exercises[] (and supersets within them)
  if (next.blocks && next.blocks.length > 0) {
    const newBlocks = next.blocks.map(b => {
      if (b.kind !== 'lift') return b;
      const liftBlock = b as any;
      const newExercises = liftBlock.exercises.map((ex: ExerciseEntry) => {
        const r = rewriteExercise(ex);
        if (r.changed) changed = true;
        return r.entry;
      });
      return { ...liftBlock, exercises: newExercises };
    });
    next.blocks = newBlocks;
  }

  // Rewrite legacy exercises[] (kept in sync with blocks per project convention)
  if (next.exercises && next.exercises.length > 0) {
    const newLegacy = next.exercises.map(ex => {
      const r = rewriteExercise(ex);
      if (r.changed) changed = true;
      return r.entry;
    });
    next.exercises = newLegacy;
  }

  return { workout: next, changed };
}

/**
 * Rewrite a split's programmed exercises across all days.
 */
function rewriteSplit<T extends Split | SavedSplit>(s: T): { split: T; changed: boolean } {
  let changed = false;
  const next: any = { ...s };
  if (next.days && typeof next.days === 'object') {
    const newDays: Record<string, any> = {};
    for (const [dayKey, dayVal] of Object.entries(next.days)) {
      const day: any = dayVal;
      if (day && Array.isArray(day.exercises)) {
        const newExs = day.exercises.map((ex: any) => {
          if (typeof ex === 'string') {
            const mapped = mapName(ex);
            if (mapped !== ex) changed = true;
            return mapped;
          }
          const r = rewriteProgrammed(ex as ProgrammedExercise);
          if (r.changed) changed = true;
          return r.entry;
        });
        newDays[dayKey] = { ...day, exercises: newExs };
      } else {
        newDays[dayKey] = day;
      }
    }
    next.days = newDays;
  }
  return { split: next as T, changed };
}

/**
 * Run the full migration once for a user. Safe to re-run — idempotent.
 * Returns the number of records rewritten.
 */
export async function runRenameMigrationV1(uid: string): Promise<number> {
  let rewritten = 0;

  try {
    // Workouts — use a one-shot fetch via subscribe-then-unsubscribe pattern.
    const workouts = await new Promise<Workout[]>((resolve) => {
      const unsub = storage.subscribeToWorkouts(uid, (list) => {
        unsub();
        resolve(list);
      });
    });

    for (const w of workouts) {
      try {
        const r = rewriteWorkout(w);
        if (r.changed) {
          await storage.saveWorkout(r.workout, uid);
          rewritten++;
        }
      } catch (err) {
        console.warn(`[renameMigrationV1] failed to migrate workout ${w.id}:`, err);
      }
    }

    // Splits
    try {
      const splits = await new Promise<Split[]>((resolve) => {
        const unsub = storage.subscribeToSplits(uid, (list) => {
          unsub();
          resolve(list);
        });
      });
      for (const s of splits) {
        try {
          const r = rewriteSplit(s);
          if (r.changed) {
            await storage.saveSplit(r.split, uid);
            rewritten++;
          }
        } catch (err) {
          console.warn(`[renameMigrationV1] failed to migrate split ${s.id}:`, err);
        }
      }
    } catch (err) {
      console.warn('[renameMigrationV1] split subscription failed:', err);
    }

    // Saved splits (custom programs the user saved)
    try {
      const saved = await new Promise<SavedSplit[]>((resolve) => {
        const unsub = storage.subscribeToSavedSplits(uid, (list) => {
          unsub();
          resolve(list);
        });
      });
      for (const s of saved) {
        try {
          const r = rewriteSplit(s);
          if (r.changed) {
            await storage.saveSavedSplit(r.split, uid);
            rewritten++;
          }
        } catch (err) {
          console.warn(`[renameMigrationV1] failed to migrate saved_split ${s.id}:`, err);
        }
      }
    } catch (err) {
      console.warn('[renameMigrationV1] saved_splits fetch failed:', err);
    }

    // Drafts — single draft doc per user. Fetch it and rewrite if present.
    try {
      const draft = await new Promise<Partial<Workout> | null>((resolve) => {
        const unsub = storage.subscribeToDraft(uid, (d) => {
          unsub();
          resolve(d);
        });
      });
      if (draft) {
        const r = rewriteWorkout(draft as Workout);
        if (r.changed) {
          await storage.saveDraft(r.workout, uid);
          rewritten++;
        }
      }
    } catch (err) {
      console.warn('[renameMigrationV1] draft fetch failed:', err);
    }
  } catch (err) {
    console.error('[renameMigrationV1] migration error:', err);
    throw err;
  }

  return rewritten;
}
