/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MuscleGroup =
  | 'Chest'
  | 'Shoulders'
  | 'Side Delts'
  | 'Rear Delts'
  | 'Triceps'
  | 'Biceps'
  | 'Forearms'
  | 'Upper Back'
  | 'Lats'
  | 'Traps'
  | 'Lower Back'
  | 'Quads'
  | 'Hip Flexors'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core'
  | 'Lower Legs'
  | 'Functional'
  | 'Plyos'
  | 'Conditioning'
  | 'Other';

export interface MuscleContribution {
  group: MuscleGroup;
  percent: number;
}

export interface ExerciseLibraryEntry {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  muscleDistribution?: MuscleContribution[];
  trackingMode: ExerciseTrackingMode;
  uid?: string;
}

export type ExerciseTrackingMode = "reps" | "distance" | "time";
export type DistanceUnit = "m" | "yd" | "ft" | "mi" | "km";

export interface ExerciseEntry {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  muscleDistribution?: MuscleContribution[];
  trackingMode?: ExerciseTrackingMode;
  sets: number;
  reps?: number;
  distance?: number;
  distanceUnit?: DistanceUnit;
  time?: number;
  timeUnit?: 'min' | 'sec';
  weight?: number;
  perSetWeights?: number[];
  usePerSetWeights?: boolean;
  rpe: number | null;
  rir: number | null;
  notes: string;
  superset?: ExerciseEntry;
}

export type CardioType = 'Repeats' | 'Ladders' | 'Intervals' | 'Zone 2' | 'Incline Treadmill' | 'Bike' | 'Ruck' | 'METCON' | 'AMRAP' | 'EMOM';

export interface Conditioning {
  type?: CardioType;
  name: string;
  reps?: number;
  workDistance?: string;
  workDuration?: string;
  workDurationUnit?: 'min' | 'sec';
  workUnits?: string;
  distanceInMeters?: number;
  restType?: 'time' | 'distance' | 'none';
  restValue?: string;
  targetSplit?: string;
  actualSplits?: string[];
  structure?: string;
  restPlan?: string;
  averagePace?: string;
  incline?: number;
  speed?: number;
  notes?: string;
  averageHeartRate?: number;
}

// ==== Block-based session model (introduced 2.6.0) ====
// Added as backward-compatible shape. Flat `exercises[]` and `conditioning`
// remain the legacy projection for downstream pages.

export type BlockKind = 'lift' | 'cardio' | 'hiit';

export type BlockPlacement = 'before' | 'after' | 'separate';

export type CardioSubtype =
  | 'Repeats'
  | 'Ladders'
  | 'Intervals'
  | 'Zone 2'
  | 'Incline Treadmill'
  | 'Bike'
  | 'Ruck';
export type HiitSubtype = 'METCON' | 'AMRAP' | 'EMOM';

export interface BlockBase {
  id: string;
  kind: BlockKind;
  placement?: BlockPlacement;
  notes?: string;
  collapsed?: boolean;
}

export interface LiftBlock extends BlockBase {
  kind: 'lift';
  title?: string;
  exercises: ExerciseEntry[];
}

export interface CardioBlock extends BlockBase {
  kind: 'cardio';
  subtype?: CardioSubtype;
  // Programmed
  programmedName?: string;
  programmedDistance?: string; // Legacy
  programmedDistanceVal?: number;
  programmedDistanceUnit?: string;
  programmedDuration?: string; // Legacy
  programmedDurationVal?: number;
  programmedDurationUnit?: string;
  programmedUnits?: string;
  programmedNotes?: string;
  // Repeats specific
  splitCount?: number;
  splits?: {
    distanceVal: number;
    distanceUnit: string;
    timeStr: string;
  }[];
  restValue?: number;
  restUnit?: string;
  averageHeartRate?: number;
  // Zone 2 specific
  zone2DistanceVal?: number;
  zone2DistanceUnit?: string;
  zone2TimeStr?: string;
  zone2AverageHeartRate?: number;
  // Logged
  loggedDistance?: string;
  loggedDuration?: string;
  loggedUnits?: string;
  loggedAveragePace?: string;
  loggedIncline?: number;
  loggedSpeed?: number;
  loggedNotes?: string;
}

export interface HiitBlock extends BlockBase {
  kind: 'hiit';
  subtype?: HiitSubtype;
  hiitType?: 'METCON' | 'AMRAP' | 'EMOM';
  exercises?: ExerciseEntry[];
  structureNotes?: string;
  // Programmed
  programmedName?: string;
  programmedReps?: number;
  programmedWorkDistance?: string; // Legacy
  programmedWorkDistanceVal?: number;
  programmedWorkDistanceUnit?: string;
  programmedWorkDuration?: string; // Legacy
  programmedWorkDurationVal?: number;
  programmedWorkDurationUnit?: string;
  programmedWorkUnits?: string;
  programmedRestType?: 'time' | 'distance' | 'none';
  programmedRestValue?: string; // Legacy
  programmedRestValueVal?: number;
  programmedRestValueUnit?: string;
  programmedStructure?: string;
  programmedTargetSplit?: string;
  // Logged
  loggedActualSplits?: string[];
  loggedAveragePace?: string;
  loggedNotes?: string;
}

export type Block = LiftBlock | CardioBlock | HiitBlock;

// Block template for Split day definitions (programmed-only, no logged fields)
export interface BlockTemplate {
  id: string;
  kind: BlockKind;
  placement?: BlockPlacement;
  title?: string;
  notes?: string;
  // For lift templates
  exercises?: (string | ProgrammedExercise)[];
  // For cardio templates
  cardioSubtype?: CardioSubtype;
  cardioName?: string;
  cardioDistance?: string;
  cardioDuration?: string;
  cardioUnits?: string;
  // For hiit templates
  hiitSubtype?: HiitSubtype;
  hiitName?: string;
  hiitReps?: number;
  hiitWorkDistance?: string;
  hiitWorkDuration?: string;
  hiitRestValue?: string;
  hiitStructure?: string;
}

export interface Workout {
  id: string;
  date: string; // ISO string
  workoutName: string;
  workoutSummary?: string;
  runningStats: string;
  conditioning?: Conditioning;
  exercises: ExerciseEntry[];
  blocks?: Block[]; // Added 2.6.0 - optional block-based representation
  inclineTreadmill?: any;
  postWorkoutEnergy: number; // 1-10
  notes: string;
  timestamp: number;
  uid?: string;
  isHistorical?: boolean;
}

export interface DeletedWorkout extends Workout {
  deletedAt: number;
  originalId: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username?: string;           // display-case (e.g. "PaytonW")
  usernameLower?: string;      // lowercase for search/uniqueness (e.g. "paytonw")
  bio?: string;
  photoURL?: string;
  height?: string;
  weight?: string;
  goalWeight?: string;
  age?: string;
  sex?: string;
  // Social (added 3.6.0)
  role?: 'user' | 'coach';     // dormant; reserved for future
  privacy?: {
    profileVisible: boolean;   // default true — others can view profile
    emailSearchable: boolean;  // default true — others can find you by email
  };
  // Training personalization (3.7.0)
  trainingExperience?: 'beginner' | 'intermediate' | 'advanced';
  volumeTargetOverrides?: Record<string, number>;  // per-muscle-group override, overrides the computed target
  createdAt?: number;
  updatedAt?: number;
  renameMigrationV1?: boolean;
  libraryNamespaceMigrationV1?: boolean;
}

export interface GuestUser {
  uid: string;
  email: string;
  displayName: string;
  isGuest: true;
}

export interface ProgrammedExercise {
  id: string;
  name: string;
  sets?: string;
  reps?: string;
  targetNotes?: string;
  superset?: ProgrammedExercise[];
}

export interface Split {
  id: string;
  day: string;
  name: string;
  running: string;
  conditioning?: Conditioning;
  exercises: (string | ProgrammedExercise)[];
  blocks?: BlockTemplate[]; // Added 2.6.0 - optional multi-block day definition
  summary?: string;
  uid: string;
}

export interface SavedSplit {
  id: string;
  name: string;
  days: Record<string, {
    name: string;
    running: string;
    exercises: (string | ProgrammedExercise)[];
    blocks?: BlockTemplate[];
    summary?: string;
  }>;
  uid: string;
  timestamp: number;
  isAIGenerated?: boolean;
  generatedBy?: string;
}
