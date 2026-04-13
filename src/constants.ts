/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExerciseLibraryEntry, MuscleGroup } from './types';

export const APP_VERSION = '3.0.3';

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

export const INITIAL_EXERCISES: ExerciseLibraryEntry[] = [
  // Chest
  { id: 'c1', name: 'Flat Bench Press', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 60 }, { group: 'Shoulders', percent: 20 }, { group: 'Triceps', percent: 20 }] },
  { id: 'c2', name: 'Barbell Bench Press', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 60 }, { group: 'Shoulders', percent: 20 }, { group: 'Triceps', percent: 20 }] },
  { id: 'c3', name: 'DB Bench Press', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 60 }, { group: 'Shoulders', percent: 20 }, { group: 'Triceps', percent: 20 }] },
  { id: 'c4', name: 'Smith Machine Bench Press', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 60 }, { group: 'Shoulders', percent: 15 }, { group: 'Triceps', percent: 25 }] },
  { id: 'c5', name: 'Incline Barbell Bench Press', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 50 }, { group: 'Shoulders', percent: 30 }, { group: 'Triceps', percent: 20 }] },
  { id: 'c6', name: 'Incline DB Bench Press', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 50 }, { group: 'Shoulders', percent: 30 }, { group: 'Triceps', percent: 20 }] },
  { id: 'c7', name: 'Incline Smith Bench Press', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 55 }, { group: 'Shoulders', percent: 25 }, { group: 'Triceps', percent: 20 }] },
  { id: 'c8', name: 'Incline Machine Press', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 55 }, { group: 'Shoulders', percent: 20 }, { group: 'Triceps', percent: 25 }] },
  { id: 'c9', name: 'Machine Chest Press', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 60 }, { group: 'Triceps', percent: 25 }, { group: 'Shoulders', percent: 15 }] },
  { id: 'c10', name: 'Decline Bench Press', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 70 }, { group: 'Triceps', percent: 20 }, { group: 'Shoulders', percent: 10 }] },
  { id: 'c11', name: 'Chest Fly', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 85 }, { group: 'Shoulders', percent: 15 }] },
  { id: 'c12', name: 'DB Chest Fly', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 85 }, { group: 'Shoulders', percent: 15 }] },
  { id: 'c13', name: 'Cable Flyes', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 85 }, { group: 'Shoulders', percent: 15 }] },
  { id: 'c14', name: 'Low-to-High Cable Flyes', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 75 }, { group: 'Shoulders', percent: 25 }] },
  { id: 'c15', name: 'Pec Deck', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 90 }, { group: 'Shoulders', percent: 10 }] },
  { id: 'c16', name: 'Dips', muscleGroup: 'Chest', trackingMode: 'reps', muscleDistribution: [{ group: 'Chest', percent: 50 }, { group: 'Triceps', percent: 35 }, { group: 'Shoulders', percent: 15 }] },

  // Shoulders
  { id: 's1', name: 'Seated Barbell Press', muscleGroup: 'Shoulders', trackingMode: 'reps', muscleDistribution: [{ group: 'Shoulders', percent: 60 }, { group: 'Triceps', percent: 30 }, { group: 'Upper Back', percent: 10 }] },
  { id: 's2', name: 'Standing OHP', muscleGroup: 'Shoulders', trackingMode: 'reps', muscleDistribution: [{ group: 'Shoulders', percent: 55 }, { group: 'Triceps', percent: 30 }, { group: 'Core', percent: 15 }] },
  { id: 's3', name: 'Seated DB Shoulder Press', muscleGroup: 'Shoulders', trackingMode: 'reps', muscleDistribution: [{ group: 'Shoulders', percent: 60 }, { group: 'Triceps', percent: 30 }, { group: 'Upper Back', percent: 10 }] },
  { id: 's4', name: 'Arnold Press', muscleGroup: 'Shoulders', trackingMode: 'reps', muscleDistribution: [{ group: 'Shoulders', percent: 60 }, { group: 'Triceps', percent: 25 }, { group: 'Chest', percent: 15 }] },
  { id: 's5', name: 'DB Lateral Raises', muscleGroup: 'Side Delts', trackingMode: 'reps', muscleDistribution: [{ group: 'Side Delts', percent: 85 }, { group: 'Shoulders', percent: 15 }] },
  { id: 's6', name: 'Cable Lateral Raises', muscleGroup: 'Side Delts', trackingMode: 'reps', muscleDistribution: [{ group: 'Side Delts', percent: 85 }, { group: 'Shoulders', percent: 15 }] },
  { id: 's7', name: 'Machine Lateral Raises', muscleGroup: 'Side Delts', trackingMode: 'reps', muscleDistribution: [{ group: 'Side Delts', percent: 85 }, { group: 'Shoulders', percent: 15 }] },
  { id: 's8', name: 'Upright Row', muscleGroup: 'Shoulders', trackingMode: 'reps', muscleDistribution: [{ group: 'Shoulders', percent: 50 }, { group: 'Traps', percent: 35 }, { group: 'Upper Back', percent: 15 }] },

  // Rear Delts
  { id: 'rd1', name: 'Rear Delt Flyes', muscleGroup: 'Rear Delts', trackingMode: 'reps', muscleDistribution: [{ group: 'Rear Delts', percent: 75 }, { group: 'Upper Back', percent: 25 }] },
  { id: 'rd2', name: 'Reverse Pec Deck', muscleGroup: 'Rear Delts', trackingMode: 'reps', muscleDistribution: [{ group: 'Rear Delts', percent: 75 }, { group: 'Upper Back', percent: 25 }] },
  { id: 'rd3', name: 'Cable Rear Delt Fly', muscleGroup: 'Rear Delts', trackingMode: 'reps', muscleDistribution: [{ group: 'Rear Delts', percent: 80 }, { group: 'Upper Back', percent: 20 }] },
  { id: 'rd4', name: 'Face Pulls', muscleGroup: 'Rear Delts', trackingMode: 'reps', muscleDistribution: [{ group: 'Rear Delts', percent: 50 }, { group: 'Upper Back', percent: 35 }, { group: 'Shoulders', percent: 15 }] },

  // Triceps
  { id: 't1', name: 'Cable Tricep Pushdowns', muscleGroup: 'Triceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Triceps', percent: 100 }] },
  { id: 't2', name: 'Single-Arm Cable Pushdowns', muscleGroup: 'Triceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Triceps', percent: 100 }] },
  { id: 't3', name: 'Rope Overhead Extensions', muscleGroup: 'Triceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Triceps', percent: 100 }] },
  { id: 't4', name: 'Overhead Cable Extensions', muscleGroup: 'Triceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Triceps', percent: 100 }] },
  { id: 't5', name: 'Skullcrushers', muscleGroup: 'Triceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Triceps', percent: 100 }] },
  { id: 't6', name: 'EZ Bar French Press', muscleGroup: 'Triceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Triceps', percent: 100 }] },
  { id: 't7', name: 'JM Press', muscleGroup: 'Triceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Triceps', percent: 70 }, { group: 'Chest', percent: 15 }, { group: 'Shoulders', percent: 15 }] },
  { id: 't8', name: 'Close-Grip Bench Press', muscleGroup: 'Triceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Triceps', percent: 55 }, { group: 'Chest', percent: 25 }, { group: 'Shoulders', percent: 20 }] },
  { id: 't9', name: 'Machine Dip', muscleGroup: 'Triceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Triceps', percent: 55 }, { group: 'Chest', percent: 30 }, { group: 'Shoulders', percent: 15 }] },

  // Biceps
  { id: 'bi1', name: 'Barbell Curls', muscleGroup: 'Biceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Biceps', percent: 85 }, { group: 'Forearms', percent: 15 }] },
  { id: 'bi2', name: 'EZ Bar Curls', muscleGroup: 'Biceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Biceps', percent: 85 }, { group: 'Forearms', percent: 15 }] },
  { id: 'bi3', name: 'DB Curls', muscleGroup: 'Biceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Biceps', percent: 85 }, { group: 'Forearms', percent: 15 }] },
  { id: 'bi4', name: 'Incline DB Curls', muscleGroup: 'Biceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Biceps', percent: 90 }, { group: 'Forearms', percent: 10 }] },
  { id: 'bi5', name: 'Hammer Curls', muscleGroup: 'Biceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Biceps', percent: 55 }, { group: 'Forearms', percent: 45 }] },
  { id: 'bi6', name: 'Cable Curls', muscleGroup: 'Biceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Biceps', percent: 85 }, { group: 'Forearms', percent: 15 }] },
  { id: 'bi7', name: 'Bayesian Cable Curls', muscleGroup: 'Biceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Biceps', percent: 90 }, { group: 'Forearms', percent: 10 }] },
  { id: 'bi8', name: 'Preacher Curls', muscleGroup: 'Biceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Biceps', percent: 90 }, { group: 'Forearms', percent: 10 }] },
  { id: 'bi9', name: 'Machine Preacher Curls', muscleGroup: 'Biceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Biceps', percent: 90 }, { group: 'Forearms', percent: 10 }] },
  { id: 'bi10', name: 'Spider Curls', muscleGroup: 'Biceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Biceps', percent: 90 }, { group: 'Forearms', percent: 10 }] },
  { id: 'bi11', name: 'Seated Incline DB Curls', muscleGroup: 'Biceps', trackingMode: 'reps', muscleDistribution: [{ group: 'Biceps', percent: 100 }] },

  // Forearms
  { id: 'f1', name: 'Wrist Curls', muscleGroup: 'Forearms', trackingMode: 'reps', muscleDistribution: [{ group: 'Forearms', percent: 100 }] },
  { id: 'f2', name: 'Reverse Wrist Curls', muscleGroup: 'Forearms', trackingMode: 'reps', muscleDistribution: [{ group: 'Forearms', percent: 100 }] },
  { id: 'f3', name: 'Cable Wrist Curls', muscleGroup: 'Forearms', trackingMode: 'reps', muscleDistribution: [{ group: 'Forearms', percent: 100 }] },
  { id: 'f4', name: 'Behind-the-Back Wrist Curls', muscleGroup: 'Forearms', trackingMode: 'reps', muscleDistribution: [{ group: 'Forearms', percent: 100 }] },
  { id: 'f5', name: 'Reverse Curls', muscleGroup: 'Forearms', trackingMode: 'reps', muscleDistribution: [{ group: 'Forearms', percent: 60 }, { group: 'Biceps', percent: 40 }] },
  { id: 'f6', name: 'Plate Pinches', muscleGroup: 'Forearms', trackingMode: 'time', muscleDistribution: [{ group: 'Forearms', percent: 80 }, { group: 'Functional', percent: 20 }] },
  { id: 'f7', name: 'Fat Grip Holds', muscleGroup: 'Forearms', trackingMode: 'time', muscleDistribution: [{ group: 'Forearms', percent: 80 }, { group: 'Functional', percent: 20 }] },
  { id: 'f8', name: 'Wrist Roller', muscleGroup: 'Forearms', trackingMode: 'time', muscleDistribution: [{ group: 'Forearms', percent: 100 }] },

  // Upper Back
  { id: 'ub1', name: 'Pendlay Row', muscleGroup: 'Upper Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Upper Back', percent: 50 }, { group: 'Lats', percent: 30 }, { group: 'Lower Back', percent: 20 }] },
  { id: 'ub2', name: 'Barbell Row', muscleGroup: 'Upper Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Upper Back', percent: 50 }, { group: 'Lats', percent: 30 }, { group: 'Lower Back', percent: 20 }] },
  { id: 'ub3', name: 'Chest-Supported Row', muscleGroup: 'Upper Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Upper Back', percent: 60 }, { group: 'Lats', percent: 25 }, { group: 'Rear Delts', percent: 15 }] },
  { id: 'ub4', name: 'Seated Cable Row', muscleGroup: 'Upper Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Upper Back', percent: 55 }, { group: 'Lats', percent: 30 }, { group: 'Rear Delts', percent: 15 }] },
  { id: 'ub5', name: 'T-Bar Row', muscleGroup: 'Upper Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Upper Back', percent: 55 }, { group: 'Lats', percent: 30 }, { group: 'Rear Delts', percent: 15 }] },
  { id: 'ub6', name: 'DB Row', muscleGroup: 'Upper Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Upper Back', percent: 45 }, { group: 'Lats', percent: 40 }, { group: 'Rear Delts', percent: 15 }] },
  { id: 'ub7', name: 'Machine High Row', muscleGroup: 'Upper Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Upper Back', percent: 55 }, { group: 'Lats', percent: 30 }, { group: 'Rear Delts', percent: 15 }] },
  { id: 'ub8', name: 'Cable High Row', muscleGroup: 'Upper Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Upper Back', percent: 55 }, { group: 'Lats', percent: 30 }, { group: 'Rear Delts', percent: 15 }] },
  { id: 'ub9', name: 'Iso-Lateral Machine Rows', muscleGroup: 'Upper Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Upper Back', percent: 55 }, { group: 'Lats', percent: 30 }, { group: 'Rear Delts', percent: 15 }] },
  { id: 'ub10', name: 'ISO Lateral Low Rows', muscleGroup: 'Upper Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Upper Back', percent: 55 }, { group: 'Lats', percent: 30 }, { group: 'Rear Delts', percent: 15 }] },

  // Lats
  { id: 'la1', name: 'Pull-Up', muscleGroup: 'Lats', trackingMode: 'reps', muscleDistribution: [{ group: 'Lats', percent: 70 }, { group: 'Biceps', percent: 20 }, { group: 'Upper Back', percent: 10 }] },
  { id: 'la2', name: 'Chin-Up', muscleGroup: 'Lats', trackingMode: 'reps', muscleDistribution: [{ group: 'Lats', percent: 60 }, { group: 'Biceps', percent: 30 }, { group: 'Upper Back', percent: 10 }] },
  { id: 'la3', name: 'Lat Pulldowns', muscleGroup: 'Lats', trackingMode: 'reps', muscleDistribution: [{ group: 'Lats', percent: 70 }, { group: 'Biceps', percent: 20 }, { group: 'Upper Back', percent: 10 }] },
  { id: 'la4', name: 'Single-Arm Lat Pulldown', muscleGroup: 'Lats', trackingMode: 'reps', muscleDistribution: [{ group: 'Lats', percent: 70 }, { group: 'Biceps', percent: 20 }, { group: 'Upper Back', percent: 10 }] },
  { id: 'la5', name: 'Straight-Arm Pulldown', muscleGroup: 'Lats', trackingMode: 'reps', muscleDistribution: [{ group: 'Lats', percent: 80 }, { group: 'Upper Back', percent: 20 }] },
  { id: 'la6', name: 'Machine Pullover', muscleGroup: 'Lats', trackingMode: 'reps', muscleDistribution: [{ group: 'Lats', percent: 80 }, { group: 'Upper Back', percent: 20 }] },
  { id: 'la7', name: 'Cable Pullover', muscleGroup: 'Lats', trackingMode: 'reps', muscleDistribution: [{ group: 'Lats', percent: 80 }, { group: 'Upper Back', percent: 20 }] },

  // Traps
  { id: 'tr1', name: 'DB Trap Shrug', muscleGroup: 'Traps', trackingMode: 'reps', muscleDistribution: [{ group: 'Traps', percent: 85 }, { group: 'Upper Back', percent: 15 }] },
  { id: 'tr2', name: 'Barbell Shrug', muscleGroup: 'Traps', trackingMode: 'reps', muscleDistribution: [{ group: 'Traps', percent: 85 }, { group: 'Upper Back', percent: 15 }] },
  { id: 'tr3', name: 'Smith Shrug', muscleGroup: 'Traps', trackingMode: 'reps', muscleDistribution: [{ group: 'Traps', percent: 85 }, { group: 'Upper Back', percent: 15 }] },
  { id: 'tr4', name: 'Trap Raises', muscleGroup: 'Traps', trackingMode: 'reps', muscleDistribution: [{ group: 'Traps', percent: 60 }, { group: 'Upper Back', percent: 25 }, { group: 'Rear Delts', percent: 15 }] },

  // Lower Back
  { id: 'lb1', name: 'Deadlift', muscleGroup: 'Lower Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Lower Back', percent: 30 }, { group: 'Hamstrings', percent: 30 }, { group: 'Glutes', percent: 25 }, { group: 'Forearms', percent: 15 }] },
  { id: 'lb2', name: 'Rack Pull', muscleGroup: 'Lower Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Lower Back', percent: 35 }, { group: 'Traps', percent: 35 }, { group: 'Hamstrings', percent: 20 }, { group: 'Forearms', percent: 10 }] },
  { id: 'lb3', name: 'Good Morning', muscleGroup: 'Lower Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Lower Back', percent: 35 }, { group: 'Hamstrings', percent: 35 }, { group: 'Glutes', percent: 20 }, { group: 'Core', percent: 10 }] },
  { id: 'lb4', name: 'Back Extension', muscleGroup: 'Lower Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Lower Back', percent: 45 }, { group: 'Hamstrings', percent: 25 }, { group: 'Glutes', percent: 20 }, { group: 'Core', percent: 10 }] },
  { id: 'lb5', name: '45-Degree Back Extension', muscleGroup: 'Lower Back', trackingMode: 'reps', muscleDistribution: [{ group: 'Lower Back', percent: 45 }, { group: 'Hamstrings', percent: 25 }, { group: 'Glutes', percent: 20 }, { group: 'Core', percent: 10 }] },

  // Quads
  { id: 'q1', name: 'Back Squat', muscleGroup: 'Quads', trackingMode: 'reps', muscleDistribution: [{ group: 'Quads', percent: 45 }, { group: 'Glutes', percent: 25 }, { group: 'Core', percent: 15 }, { group: 'Hamstrings', percent: 15 }] },
  { id: 'q2', name: 'Front Squat', muscleGroup: 'Quads', trackingMode: 'reps', muscleDistribution: [{ group: 'Quads', percent: 55 }, { group: 'Glutes', percent: 15 }, { group: 'Core', percent: 20 }, { group: 'Hamstrings', percent: 10 }] },
  { id: 'q3', name: 'Hack Squat', muscleGroup: 'Quads', trackingMode: 'reps', muscleDistribution: [{ group: 'Quads', percent: 70 }, { group: 'Glutes', percent: 20 }, { group: 'Hamstrings', percent: 10 }] },
  { id: 'q4', name: 'Belt Squat', muscleGroup: 'Quads', trackingMode: 'reps', muscleDistribution: [{ group: 'Quads', percent: 65 }, { group: 'Glutes', percent: 25 }, { group: 'Hamstrings', percent: 10 }] },
  { id: 'q5', name: 'Leg Press', muscleGroup: 'Quads', trackingMode: 'reps', muscleDistribution: [{ group: 'Quads', percent: 60 }, { group: 'Glutes', percent: 25 }, { group: 'Hamstrings', percent: 15 }] },
  { id: 'q6', name: 'Smith Machine Squat', muscleGroup: 'Quads', trackingMode: 'reps', muscleDistribution: [{ group: 'Quads', percent: 50 }, { group: 'Glutes', percent: 35 }, { group: 'Hamstrings', percent: 10 }, { group: 'Core', percent: 5 }] },
  { id: 'q7', name: 'Leg Extensions', muscleGroup: 'Quads', trackingMode: 'reps', muscleDistribution: [{ group: 'Quads', percent: 100 }] },
  { id: 'q8', name: 'Bulgarian Split Squat', muscleGroup: 'Quads', trackingMode: 'reps', muscleDistribution: [{ group: 'Quads', percent: 45 }, { group: 'Glutes', percent: 35 }, { group: 'Hamstrings', percent: 10 }, { group: 'Core', percent: 10 }] },
  { id: 'q9', name: 'Zercher Bulgarian Split Squat', muscleGroup: 'Quads', trackingMode: 'reps', muscleDistribution: [{ group: 'Quads', percent: 40 }, { group: 'Glutes', percent: 30 }, { group: 'Core', percent: 20 }, { group: 'Hamstrings', percent: 10 }] },
  { id: 'q10', name: 'DB Lunges', muscleGroup: 'Quads', trackingMode: 'reps', muscleDistribution: [{ group: 'Quads', percent: 45 }, { group: 'Glutes', percent: 30 }, { group: 'Hamstrings', percent: 10 }, { group: 'Core', percent: 15 }] },
  { id: 'q11', name: 'KB Lunges', muscleGroup: 'Quads', trackingMode: 'reps', muscleDistribution: [{ group: 'Quads', percent: 45 }, { group: 'Glutes', percent: 30 }, { group: 'Hamstrings', percent: 10 }, { group: 'Core', percent: 15 }] },
  { id: 'q12', name: 'Walking Lunges', muscleGroup: 'Quads', trackingMode: 'distance', muscleDistribution: [{ group: 'Quads', percent: 45 }, { group: 'Glutes', percent: 35 }, { group: 'Hamstrings', percent: 10 }, { group: 'Core', percent: 10 }] },
  { id: 'q13', name: 'Step-Ups', muscleGroup: 'Quads', trackingMode: 'reps', muscleDistribution: [{ group: 'Quads', percent: 45 }, { group: 'Glutes', percent: 35 }, { group: 'Hamstrings', percent: 10 }, { group: 'Core', percent: 10 }] },

  // Hamstrings
  { id: 'ha1', name: 'Hamstring Curls', muscleGroup: 'Hamstrings', trackingMode: 'reps', muscleDistribution: [{ group: 'Hamstrings', percent: 100 }] },
  { id: 'ha2', name: 'Seated Leg Curl', muscleGroup: 'Hamstrings', trackingMode: 'reps', muscleDistribution: [{ group: 'Hamstrings', percent: 100 }] },
  { id: 'ha3', name: 'Lying Leg Curl', muscleGroup: 'Hamstrings', trackingMode: 'reps', muscleDistribution: [{ group: 'Hamstrings', percent: 100 }] },
  { id: 'ha4', name: 'Single-Leg Curl', muscleGroup: 'Hamstrings', trackingMode: 'reps', muscleDistribution: [{ group: 'Hamstrings', percent: 100 }] },
  { id: 'ha5', name: 'Nordic Curl', muscleGroup: 'Hamstrings', trackingMode: 'reps', muscleDistribution: [{ group: 'Hamstrings', percent: 85 }, { group: 'Glutes', percent: 15 }] },
  { id: 'ha6', name: 'RDL', muscleGroup: 'Hamstrings', trackingMode: 'reps', muscleDistribution: [{ group: 'Hamstrings', percent: 45 }, { group: 'Glutes', percent: 25 }, { group: 'Lower Back', percent: 20 }, { group: 'Forearms', percent: 10 }] },
  { id: 'ha7', name: 'Stiff-Leg Deadlift', muscleGroup: 'Hamstrings', trackingMode: 'reps', muscleDistribution: [{ group: 'Hamstrings', percent: 45 }, { group: 'Lower Back', percent: 25 }, { group: 'Glutes', percent: 20 }, { group: 'Forearms', percent: 10 }] },
  { id: 'ha8', name: 'GHR', muscleGroup: 'Hamstrings', trackingMode: 'reps', muscleDistribution: [{ group: 'Hamstrings', percent: 70 }, { group: 'Glutes', percent: 20 }, { group: 'Lower Back', percent: 10 }] },
  { id: 'ha9', name: 'Cable Pull-Through', muscleGroup: 'Hamstrings', trackingMode: 'reps', muscleDistribution: [{ group: 'Glutes', percent: 65 }, { group: 'Hamstrings', percent: 25 }, { group: 'Lower Back', percent: 10 }] },

  // Glutes
  { id: 'gl1', name: 'Hip Thrust', muscleGroup: 'Glutes', trackingMode: 'reps', muscleDistribution: [{ group: 'Glutes', percent: 80 }, { group: 'Hamstrings', percent: 20 }] },
  { id: 'gl2', name: 'Barbell Glute Bridge', muscleGroup: 'Glutes', trackingMode: 'reps', muscleDistribution: [{ group: 'Glutes', percent: 80 }, { group: 'Hamstrings', percent: 20 }] },
  { id: 'gl3', name: 'Glute Drive Machine', muscleGroup: 'Glutes', trackingMode: 'reps', muscleDistribution: [{ group: 'Glutes', percent: 80 }, { group: 'Hamstrings', percent: 20 }] },
  { id: 'gl4', name: 'Cable Kickbacks', muscleGroup: 'Glutes', trackingMode: 'reps', muscleDistribution: [{ group: 'Glutes', percent: 90 }, { group: 'Hamstrings', percent: 10 }] },
  { id: 'gl5', name: 'Sumo Deadlift', muscleGroup: 'Glutes', trackingMode: 'reps', muscleDistribution: [{ group: 'Glutes', percent: 40 }, { group: 'Hamstrings', percent: 25 }, { group: 'Lower Back', percent: 20 }, { group: 'Quads', percent: 15 }] },

  // Calves
  { id: 'ca1', name: 'Standing Calf Raises', muscleGroup: 'Calves', trackingMode: 'reps', muscleDistribution: [{ group: 'Calves', percent: 100 }] },
  { id: 'ca2', name: 'Seated Calf Raises', muscleGroup: 'Calves', trackingMode: 'reps', muscleDistribution: [{ group: 'Calves', percent: 100 }] },
  { id: 'ca3', name: 'Leg Press Calf Raises', muscleGroup: 'Calves', trackingMode: 'reps', muscleDistribution: [{ group: 'Calves', percent: 100 }] },
  { id: 'ca4', name: 'Smith Calf Raises', muscleGroup: 'Calves', trackingMode: 'reps', muscleDistribution: [{ group: 'Calves', percent: 100 }] },
  { id: 'ca5', name: 'Single-Leg Calf Raises', muscleGroup: 'Calves', trackingMode: 'reps', muscleDistribution: [{ group: 'Calves', percent: 100 }] },

  // Core
  { id: 'co1', name: 'Hanging Leg Raises', muscleGroup: 'Core', trackingMode: 'reps', muscleDistribution: [{ group: 'Core', percent: 100 }] },
  { id: 'co2', name: 'Ab Wheel', muscleGroup: 'Core', trackingMode: 'reps', muscleDistribution: [{ group: 'Core', percent: 100 }] },
  { id: 'co3', name: 'Cable Crunch', muscleGroup: 'Core', trackingMode: 'reps', muscleDistribution: [{ group: 'Core', percent: 100 }] },
  { id: 'co4', name: 'Decline Sit-Up', muscleGroup: 'Core', trackingMode: 'reps', muscleDistribution: [{ group: 'Core', percent: 100 }] },
  { id: 'co5', name: 'Weighted Sit-Up', muscleGroup: 'Core', trackingMode: 'reps', muscleDistribution: [{ group: 'Core', percent: 100 }] },
  { id: 'co6', name: 'GHD Sit-Up', muscleGroup: 'Core', trackingMode: 'reps', muscleDistribution: [{ group: 'Core', percent: 100 }] },
  { id: 'co7', name: 'Plank', muscleGroup: 'Core', trackingMode: 'time', muscleDistribution: [{ group: 'Core', percent: 100 }] },
  { id: 'co8', name: 'Side Plank', muscleGroup: 'Core', trackingMode: 'time', muscleDistribution: [{ group: 'Core', percent: 100 }] },
  { id: 'co9', name: 'Pallof Press', muscleGroup: 'Core', trackingMode: 'reps', muscleDistribution: [{ group: 'Core', percent: 100 }] },
  { id: 'co10', name: 'Dead Bug', muscleGroup: 'Core', trackingMode: 'reps', muscleDistribution: [{ group: 'Core', percent: 100 }] },
  { id: 'co11', name: 'Russian Twists', muscleGroup: 'Core', trackingMode: 'reps', muscleDistribution: [{ group: 'Core', percent: 100 }] },
  { id: 'co12', name: 'Ab Rollouts', muscleGroup: 'Core', trackingMode: 'reps', muscleDistribution: [{ group: 'Core', percent: 100 }] },

  // Lower Legs
  { id: 'll1', name: 'Tib Raises', muscleGroup: 'Lower Legs', trackingMode: 'reps', muscleDistribution: [{ group: 'Lower Legs', percent: 100 }] },
  { id: 'll2', name: 'Seated Tib Raises', muscleGroup: 'Lower Legs', trackingMode: 'reps', muscleDistribution: [{ group: 'Lower Legs', percent: 100 }] },
  { id: 'll3', name: 'KB Seated Tibial Raises', muscleGroup: 'Lower Legs', trackingMode: 'reps', muscleDistribution: [{ group: 'Lower Legs', percent: 100 }] },
  { id: 'll4', name: 'Ankle Rotations', muscleGroup: 'Lower Legs', trackingMode: 'reps', muscleDistribution: [{ group: 'Lower Legs', percent: 100 }] },

  // Functional
  { id: 'fu1', name: "Farmer's Carries", muscleGroup: 'Functional', trackingMode: 'distance', muscleDistribution: [{ group: 'Functional', percent: 50 }, { group: 'Forearms', percent: 25 }, { group: 'Core', percent: 25 }] },
  { id: 'fu2', name: 'Suitcase Carry', muscleGroup: 'Functional', trackingMode: 'distance', muscleDistribution: [{ group: 'Functional', percent: 45 }, { group: 'Core', percent: 35 }, { group: 'Forearms', percent: 20 }] },
  { id: 'fu3', name: 'Front Rack Carry', muscleGroup: 'Functional', trackingMode: 'distance', muscleDistribution: [{ group: 'Functional', percent: 45 }, { group: 'Core', percent: 35 }, { group: 'Upper Back', percent: 20 }] },
  { id: 'fu4', name: 'Sled Push', muscleGroup: 'Functional', trackingMode: 'distance', muscleDistribution: [{ group: 'Functional', percent: 40 }, { group: 'Quads', percent: 25 }, { group: 'Glutes', percent: 20 }, { group: 'Lower Legs', percent: 15 }] },
  { id: 'fu5', name: 'Sled Pull', muscleGroup: 'Functional', trackingMode: 'distance', muscleDistribution: [{ group: 'Functional', percent: 40 }, { group: 'Hamstrings', percent: 20 }, { group: 'Glutes', percent: 20 }, { group: 'Forearms', percent: 20 }] },
  { id: 'fu6', name: 'Prowler March', muscleGroup: 'Functional', trackingMode: 'distance', muscleDistribution: [{ group: 'Functional', percent: 40 }, { group: 'Glutes', percent: 20 }, { group: 'Quads', percent: 20 }, { group: 'Lower Legs', percent: 20 }] },

  // Plyos
  { id: 'pl1', name: 'Box Jumps', muscleGroup: 'Plyos', trackingMode: 'reps', muscleDistribution: [{ group: 'Plyos', percent: 60 }, { group: 'Quads', percent: 20 }, { group: 'Glutes', percent: 20 }] },
  { id: 'pl2', name: 'Broad Jumps', muscleGroup: 'Plyos', trackingMode: 'reps', muscleDistribution: [{ group: 'Plyos', percent: 60 }, { group: 'Glutes', percent: 25 }, { group: 'Hamstrings', percent: 15 }] },
  { id: 'pl3', name: 'Split Squat Plyos', muscleGroup: 'Plyos', trackingMode: 'reps', muscleDistribution: [{ group: 'Plyos', percent: 50 }, { group: 'Quads', percent: 30 }, { group: 'Glutes', percent: 20 }] },
  { id: 'pl4', name: 'Explosive Split Jump Switches', muscleGroup: 'Plyos', trackingMode: 'reps', muscleDistribution: [{ group: 'Plyos', percent: 50 }, { group: 'Quads', percent: 30 }, { group: 'Glutes', percent: 20 }] },

  // Other
  { id: 'ot1', name: 'Burpees', muscleGroup: 'Other', trackingMode: 'reps', muscleDistribution: [{ group: 'Conditioning', percent: 50 }, { group: 'Shoulders', percent: 25 }, { group: 'Quads', percent: 25 }] },
  { id: 'ot2', name: 'Battle Ropes', muscleGroup: 'Other', trackingMode: 'time', muscleDistribution: [{ group: 'Conditioning', percent: 60 }, { group: 'Shoulders', percent: 25 }, { group: 'Core', percent: 15 }] },
]

export const DEFAULT_SPLIT: Record<string, { name: string; running: string; exercises: (string | any)[]; summary: string }> = {
  'Monday': { name: 'Chest & Triceps', running: 'None', exercises: ['Flat Bench Press', 'Cable Tricep Pushdowns'], summary: 'Chest & Triceps\n- Flat Bench Press: 3x8-10\n- Cable Tricep Pushdowns: 3x10-12' },
  'Tuesday': { name: 'Back & Biceps', running: 'None', exercises: ['Barbell Row', 'Barbell Curls'], summary: 'Back & Biceps\n- Barbell Row: 3x8-10\n- Barbell Curls: 3x10-12' },
  'Wednesday': { name: 'Legs', running: 'None', exercises: ['Back Squat', 'Lying Leg Curl'], summary: 'Legs\n- Back Squat: 3x5-8\n- Lying Leg Curl: 3x10-12' },
  'Thursday': { name: 'Shoulders', running: 'None', exercises: ['Seated Barbell Press', 'DB Lateral Raises'], summary: 'Shoulders\n- Seated Barbell Press: 3x8-10\n- DB Lateral Raises: 3x12-15' },
  'Friday': { name: 'Full Body', running: 'None', exercises: ['Deadlift', 'Pull-Ups'], summary: 'Full Body\n- Deadlift: 3x5\n- Pull-Ups: 3xAMRAP' },
  'Saturday': { name: 'Rest', running: 'None', exercises: [], summary: 'Rest Day' },
  'Sunday': { name: 'Rest', running: 'None', exercises: [], summary: 'Rest Day' },
};

export const SPLIT_TEMPLATES: any[] = [
  {
    id: "hybrid-performance-spring-2026",
    name: "Hybrid Performance Split (Spring 2026)",
    description: "Consolidated stress: sprints and lower body lifts occur on the same day. High intent, low volume. One primary strength movement per day. Functional staples matter, including Zercher Bulgarian Split Squats and Deadlift Rows. Optional post-lift Zone 2 Incline Treadmill Walk can be used as a finisher.",
    days: {
      'Monday': { name: 'Posterior Biased Leg Day (DPE-D)', running: '800m Repeats (3 to 5x)', exercises: ['Deadlift', 'Barbell Row', 'Pull-Up', "Farmer's Carries", 'RDL', 'Hamstring Curls'], summary: 'Posterior Biased Leg Day (DPE-D)\n- Deadlift: 3x5\n- Barbell Row: 3x8\n- Pull-Up: 3xAMRAP\n- Farmer\'s Carries: 3x30m\n- RDL: 3x10\n- Hamstring Curls: 3x12' },
      'Tuesday': { name: 'Push', running: 'Optional Zone 2 Run', exercises: ['Flat Bench Press', 'Seated Barbell Press', 'DB Lateral Raises', 'Machine Lateral Raises', 'Incline Machine Press', 'Chest Fly', 'JM Press'], summary: 'Push Day\n- Flat Bench Press: 3x8\n- Seated Barbell Press: 3x8\n- DB Lateral Raises: 3x12\n- Machine Lateral Raises: 3x12\n- Incline Machine Press: 3x10\n- Chest Fly: 3x12\n- JM Press: 3x10' },
      'Wednesday': { name: 'Quad Biased Leg Day (DPE-B)', running: '400m Repeats (5 to 6x)', exercises: ['Front Squat', 'Zercher Bulgarian Split Squat', 'Russian Twists', 'KB Lunges', 'Sled Push', 'Split Squat Plyos', 'KB Seated Tibial Raises', 'Ankle Rotations'], summary: 'Quad Biased Leg Day (DPE-B)\n- Front Squat: 3x8\n- Zercher Bulgarian Split Squat: 3x10\n- Russian Twists: 3x20\n- KB Lunges: 3x12\n- Sled Push: 3x20m\n- Split Squat Plyos: 3x10\n- KB Seated Tibial Raises: 3x15\n- Ankle Rotations: 3x20' },
      'Thursday': { name: 'Pull', running: 'Optional Zone 2 Run', exercises: ["Farmer's Carries", 'DB Trap Shrug', 'Face Pulls', 'Rear Delt Flyes', 'Pendlay Row', 'Lat Pulldowns', 'ISO Lateral Low Rows', 'Iso-Lateral Machine Rows', 'Hammer Curls', 'Seated Incline DB Curls'], summary: 'Pull Day\n- Farmer\'s Carries: 3x30m\n- DB Trap Shrug: 3x12\n- Face Pulls: 3x15\n- Rear Delt Flyes: 3x15\n- Pendlay Row: 3x8\n- Lat Pulldowns: 3x10\n- ISO Lateral Low Rows: 3x10\n- Iso-Lateral Machine Rows: 3x10\n- Hammer Curls: 3x12\n- Seated Incline DB Curls: 3x12' },
      'Friday': { name: 'SHARMS (Modular)', running: 'Modular Speed (Ladders / Mile Repeats)', exercises: ['Seated Barbell Press', 'Arnold Press', 'Seated DB Shoulder Press', 'DB Lateral Raises', 'Cable Lateral Raises', 'Cable Tricep Pushdowns', 'Skullcrushers', 'DB Curls', 'Hammer Curls'], summary: 'SHARMS (Modular)\n- Seated Barbell Press: 3x8\n- Arnold Press: 3x10\n- Seated DB Shoulder Press: 3x10\n- DB Lateral Raises: 3x12\n- Cable Lateral Raises: 3x12\n- Cable Tricep Pushdowns: 3x12\n- Skullcrushers: 3x10\n- DB Curls: 3x12\n- Hammer Curls: 3x12' },
      'Saturday': { name: 'Chest & Back (Modular)', running: 'Zone 2 Run (2 to 5 miles)', exercises: ['Flat Bench Press', 'Incline Barbell Bench Press', 'Chest Fly', 'Machine Chest Press', 'Lat Pulldowns', 'Seated Cable Row', 'Chest-Supported Row', 'Machine High Row'], summary: 'Chest & Back (Modular)\n- Flat Bench Press: 3x8\n- Incline Barbell Bench Press: 3x8\n- Chest Fly: 3x12\n- Machine Chest Press: 3x10\n- Lat Pulldowns: 3x10\n- Seated Cable Row: 3x10\n- Chest-Supported Row: 3x10\n- Machine High Row: 3x10' },
      'Sunday': { name: 'Recovery & Prep', running: 'Full Rest / Optional Chill Z2', exercises: [], summary: 'Rest Day' },
    }
  },
  {
    id: "pplrppl-classic",
    name: "PPLRPPL",
    description: "Classic 6-day Push/Pull/Legs rotation with one rest day. Each movement pattern is trained twice weekly.",
    days: {
      Monday: {
        name: "Push A",
        running: "None",
        exercises: [
          "Flat Bench Press",
          "Seated Barbell Press",
          "Incline DB Bench Press",
          "DB Lateral Raises",
          "Cable Tricep Pushdowns",
          "Skullcrushers"
        ],
        summary: "Push A\n- Flat Bench Press: 4x6-8\n- Seated Barbell Press: 3x8-10\n- Incline DB Bench Press: 3x10\n- DB Lateral Raises: 3x12-15\n- Cable Tricep Pushdowns: 3x12\n- Skullcrushers: 3x10"
      },
      Tuesday: {
        name: "Pull A",
        running: "None",
        exercises: [
          "Barbell Row",
          "Pull-Up",
          "Lat Pulldowns",
          "Face Pulls",
          "Barbell Curls",
          "Hammer Curls"
        ],
        summary: "Pull A\n- Barbell Row: 4x6-8\n- Pull-Up: 3xAMRAP\n- Lat Pulldowns: 3x10\n- Face Pulls: 3x15\n- Barbell Curls: 3x10\n- Hammer Curls: 3x12"
      },
      Wednesday: {
        name: "Legs A",
        running: "None",
        exercises: [
          "Back Squat",
          "RDL",
          "Leg Press",
          "Lying Leg Curl",
          "Walking Lunges"
        ],
        summary: "Legs A\n- Back Squat: 4x6-8\n- RDL: 3x8-10\n- Leg Press: 3x10-12\n- Lying Leg Curl: 3x12\n- Walking Lunges: 3x10/leg"
      },
      Thursday: {
        name: "Rest",
        running: "Optional Zone 2",
        exercises: [],
        summary: "Rest Day"
      },
      Friday: {
        name: "Push B",
        running: "None",
        exercises: [
          "Incline Barbell Bench Press",
          "Arnold Press",
          "Machine Chest Press",
          "Machine Lateral Raises",
          "JM Press",
          "Cable Tricep Pushdowns"
        ],
        summary: "Push B\n- Incline Barbell Bench Press: 4x6-8\n- Arnold Press: 3x10\n- Machine Chest Press: 3x10-12\n- Machine Lateral Raises: 3x15\n- JM Press: 3x10\n- Cable Tricep Pushdowns: 3x12"
      },
      Saturday: {
        name: "Pull B",
        running: "None",
        exercises: [
          "Deadlift",
          "Chest-Supported Row",
          "Seated Cable Row",
          "Rear Delt Flyes",
          "Preacher Curls",
          "Seated Incline DB Curls"
        ],
        summary: "Pull B\n- Deadlift: 3x5\n- Chest-Supported Row: 3x10\n- Seated Cable Row: 3x12\n- Rear Delt Flyes: 3x15\n- Preacher Curls: 3x10\n- Seated Incline DB Curls: 3x12"
      },
      Sunday: {
        name: "Legs B",
        running: "None",
        exercises: [
          "Front Squat",
          "Bulgarian Split Squat",
          "Leg Extensions",
          "Hamstring Curls",
          "Seated Calf Raise"
        ],
        summary: "Legs B\n- Front Squat: 4x6-8\n- Bulgarian Split Squat: 3x10/leg\n- Leg Extensions: 3x12\n- Hamstring Curls: 3x12\n- Seated Calf Raise: 4x15"
      }
    }
  },
  {
    id: "bro-split-5day",
    name: "5-Day Bro Split",
    description: "Classic 5-day body-part split with two rest days. High session volume, lower weekly frequency.",
    days: {
      Monday: {
        name: "Chest",
        running: "None",
        exercises: [
          "Flat Bench Press",
          "Incline Barbell Bench Press",
          "Incline DB Bench Press",
          "Machine Chest Press",
          "Chest Fly",
          "Dips"
        ],
        summary: "Chest Day\n- Flat Bench Press: 4x6-8\n- Incline Barbell Bench Press: 3x8-10\n- Incline DB Bench Press: 3x10\n- Machine Chest Press: 3x12\n- Chest Fly: 3x12-15\n- Dips: 3xAMRAP"
      },
      Tuesday: {
        name: "Back",
        running: "None",
        exercises: [
          "Deadlift",
          "Pull-Up",
          "Barbell Row",
          "Lat Pulldowns",
          "Seated Cable Row",
          "Face Pulls"
        ],
        summary: "Back Day\n- Deadlift: 4x5\n- Pull-Up: 3xAMRAP\n- Barbell Row: 3x8-10\n- Lat Pulldowns: 3x10-12\n- Seated Cable Row: 3x12\n- Face Pulls: 3x15"
      },
      Wednesday: {
        name: "Legs",
        running: "None",
        exercises: [
          "Back Squat",
          "Leg Press",
          "Walking Lunges",
          "Lying Leg Curl",
          "Leg Extensions",
          "Hamstring Curls"
        ],
        summary: "Leg Day\n- Back Squat: 4x6-8\n- Leg Press: 3x10-12\n- Walking Lunges: 3x10/leg\n- Lying Leg Curl: 3x12\n- Leg Extensions: 3x12\n- Hamstring Curls: 3x12"
      },
      Thursday: {
        name: "Shoulders",
        running: "None",
        exercises: [
          "Seated Barbell Press",
          "Arnold Press",
          "DB Lateral Raises",
          "Cable Lateral Raises",
          "Rear Delt Flyes",
          "Face Pulls"
        ],
        summary: "Shoulder Day\n- Seated Barbell Press: 4x6-8\n- Arnold Press: 3x10\n- DB Lateral Raises: 4x12-15\n- Cable Lateral Raises: 3x15\n- Rear Delt Flyes: 3x15\n- Face Pulls: 3x15"
      },
      Friday: {
        name: "Arms",
        running: "None",
        exercises: [
          "Barbell Curls",
          "Skullcrushers",
          "Hammer Curls",
          "Cable Tricep Pushdowns",
          "Preacher Curls",
          "JM Press"
        ],
        summary: "Arms Day\n- Barbell Curls: 4x8-10\n- Skullcrushers: 4x8-10\n- Hammer Curls: 3x12\n- Cable Tricep Pushdowns: 3x12\n- Preacher Curls: 3x10\n- JM Press: 3x10"
      },
      Saturday: {
        name: "Rest",
        running: "None",
        exercises: [],
        summary: "Rest Day"
      },
      Sunday: {
        name: "Rest",
        running: "None",
        exercises: [],
        summary: "Rest Day"
      }
    }
  }
];

