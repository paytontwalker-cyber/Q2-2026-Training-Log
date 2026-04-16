/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExerciseLibraryEntry, MuscleGroup } from './types';
import INITIAL_EXERCISES_DATA from './data/exercises.json';
import TEMPLATES_DATA from './data/templates.json';

export const APP_VERSION = '3.2.1';

export const INITIAL_EXERCISES: ExerciseLibraryEntry[] = INITIAL_EXERCISES_DATA as ExerciseLibraryEntry[];
export const DEFAULT_SPLIT = TEMPLATES_DATA.defaultSplit;
export const SPLIT_TEMPLATES = TEMPLATES_DATA.splitTemplates;

export const STATUS_EXPLANATIONS: Record<string, string> = {
  'Low': 'Under 70% of target volume.',
  'Near': '70% to 99% of target volume.',
  'On Target': '100% to 119% of target volume.',
  'Above Zone': '120% or more of target volume.',
};
export const MUSCLE_VOLUME_TARGETS: Record<string, number> = {
  Chest: 8000,
  Back: 12000,
  Quads: 10000,
  Hamstrings: 7000,
  Glutes: 8000,
  Shoulders: 5000,
  'Side Delts': 3000,
  'Rear Delts': 3500,
  Biceps: 3500,
  Triceps: 4000,
  Calves: 6000,
  'Abs/Core': 2500,
  Traps: 4000,
  Forearms: 2500,
};

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

