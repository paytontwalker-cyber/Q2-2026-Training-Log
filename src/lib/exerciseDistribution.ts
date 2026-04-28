import { ExerciseEntry, ExerciseLibraryEntry, MuscleContribution } from '../types';
import { INITIAL_EXERCISES } from '../constants';

export const resolveExerciseDistribution = (
  ex: ExerciseEntry,
  library: ExerciseLibraryEntry[] = []
): MuscleContribution[] => {
  const matchById = ex.id
    ? library.find(le => le.id === ex.id)
    : undefined;

  const normalizedName = ex.name.toLowerCase().trim();

  const matchByName = library.find(
    le => le.name.toLowerCase().trim() === normalizedName
  );

  let aliasMatch: ExerciseLibraryEntry | undefined;
  if (!matchByName) {
    const aliasMap: Record<string, string[]> = {
      'Deadlift': ['barbell deadlift', 'conventional deadlift'],
      'RDL': ['romanian deadlift', 'barbell rdl', 'db rdl'],
      'Single Leg RDL': ['single leg db rdl'],
      'Stiff Leg Deadlift': ['sl dl', 'sldl']
    };

    for (const [canonical, aliases] of Object.entries(aliasMap)) {
       if (aliases.includes(normalizedName)) {
         aliasMatch = library.find(le => le.name.toLowerCase().trim() === canonical.toLowerCase().trim());
         if (aliasMatch) break;
       }
    }
  }

  const currentLibraryEx = matchById || matchByName || aliasMatch;

  if (currentLibraryEx?.muscleDistribution?.length) {
    return currentLibraryEx.muscleDistribution;
  }

  const defaultById = ex.id
    ? INITIAL_EXERCISES.find(le => le.id === ex.id)
    : undefined;

  const defaultByName = INITIAL_EXERCISES.find(
    le => le.name.toLowerCase().trim() === normalizedName
  );

  let defaultAliasMatch: ExerciseLibraryEntry | undefined;
  if (!defaultByName) {
    const aliasMap: Record<string, string[]> = {
      'Deadlift': ['barbell deadlift', 'conventional deadlift'],
      'RDL': ['romanian deadlift', 'barbell rdl', 'db rdl'],
      'Single Leg RDL': ['single leg db rdl'],
      'Stiff Leg Deadlift': ['sl dl', 'sldl']
    };

    for (const [canonical, aliases] of Object.entries(aliasMap)) {
       if (aliases.includes(normalizedName)) {
         defaultAliasMatch = INITIAL_EXERCISES.find(le => le.name.toLowerCase().trim() === canonical.toLowerCase().trim());
         if (defaultAliasMatch) break;
       }
    }
  }

  const defaultEx = defaultById || defaultByName || defaultAliasMatch;

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
