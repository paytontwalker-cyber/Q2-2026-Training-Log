/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExerciseLibraryEntry, MuscleGroup } from './types';
import INITIAL_EXERCISES_DATA from './data/exercises.json';
import TEMPLATES_DATA from './data/templates.json';

export const APP_VERSION = '4.4.8';

export const INITIAL_EXERCISES: ExerciseLibraryEntry[] = INITIAL_EXERCISES_DATA as ExerciseLibraryEntry[];
export const DEFAULT_SPLIT = TEMPLATES_DATA.defaultSplit;
export const SPLIT_TEMPLATES = TEMPLATES_DATA.splitTemplates;

export const STATUS_EXPLANATIONS: Record<string, string> = {
  'Low': 'Under 70% of target volume.',
  'Near': '70% to 99% of target volume.',
  'On Target': '100% to 119% of target volume.',
  'Above Zone': '120% or more of target volume.',
};
// Base weekly volume targets (in lbs moved) for an intermediate lifter at 180 lb bodyweight.
// Monolithic 'Back' has been deprecated in favor of granular tracking.
export const BASE_VOLUME_TARGETS_180LB_INTERMEDIATE: Record<string, number> = {
  Chest: 5400,
  Quads: 3600,
  Hamstrings: 3600,
  Lats: 2700,
  'Upper Back': 1800,
  Shoulders: 1800,
  Triceps: 1800,
  Biceps: 1800,
  Glutes: 1800,
  Calves: 1800,
  'Lower Legs': 900, // Tibialis Anterior
  'Side Delts': 900,
  'Rear Delts': 900,
  Traps: 900,
  'Lower Back': 900,
  Forearms: 900,
  Core: 2700,
  'Hip Flexors': 500
};

// Experience multipliers scale targets to training age.
// Beginners can grow on less volume; advanced lifters require more to continue progressing.
export const EXPERIENCE_MULTIPLIERS: Record<'beginner' | 'intermediate' | 'advanced', number> = {
  beginner: 0.70,
  intermediate: 1.00,
  advanced: 1.30,
};

// Keep the old export name as an alias that maps to intermediate-180lb values.
// Allows gradual migration of callers; we're updating all in this patch.
/** @deprecated Use computeVolumeTargets(profile) instead */
export const MUSCLE_VOLUME_TARGETS = BASE_VOLUME_TARGETS_180LB_INTERMEDIATE;

export const CARDIO_SUBTYPES = ['Repeats', 'Ladders', 'Intervals', 'Zone 2', 'Incline Treadmill', 'Bike', 'Ruck'];
export const HIIT_SUBTYPES = ['METCON', 'AMRAP', 'EMOM'];

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Shoulders',
  'Side Delts',
  'Rear Delts',
  'Triceps',
  'Biceps',
  'Forearms',
  'Upper Back',
  'Lats',
  'Traps',
  'Lower Back',
  'Quads',
  'Hip Flexors',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Lower Legs',
  'Functional',
  'Plyos',
  'Conditioning',
  'Other',
];

