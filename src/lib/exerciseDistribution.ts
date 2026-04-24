import { ExerciseEntry, ExerciseLibraryEntry, MuscleContribution } from '../types';
import { INITIAL_EXERCISES } from '../constants';

export const resolveExerciseDistribution = (
  ex: ExerciseEntry,
  library: ExerciseLibraryEntry[] = []
): MuscleContribution[] => {
  const matchById = ex.id
    ? library.find(le => le.id === ex.id)
    : undefined;

  const matchByName = library.find(
    le => le.name.toLowerCase().trim() === ex.name.toLowerCase().trim()
  );

  const currentLibraryEx = matchById || matchByName;

  if (currentLibraryEx?.muscleDistribution?.length) {
    return currentLibraryEx.muscleDistribution;
  }

  const defaultById = ex.id
    ? INITIAL_EXERCISES.find(le => le.id === ex.id)
    : undefined;

  const defaultByName = INITIAL_EXERCISES.find(
    le => le.name.toLowerCase().trim() === ex.name.toLowerCase().trim()
  );

  const defaultEx = defaultById || defaultByName;

  if (defaultEx?.muscleDistribution?.length) {
    return defaultEx.muscleDistribution;
  }

  if (ex.muscleDistribution?.length) {
    return ex.muscleDistribution;
  }

  if (ex.muscleGroup) {
    return [{ group: ex.muscleGroup, percent: 100 }];
  }

  return [{ group: 'Other', percent: 100 }];
};
