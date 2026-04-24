import { useState, useEffect } from 'react';
import { useFirebase } from '@/src/components/FirebaseProvider';
import { storage } from '@/src/services/storage';
import { Workout, ExerciseEntry } from '@/src/types';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { INITIAL_EXERCISES } from '@/src/constants';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)');
}

const calculateExerciseVolume = (ex: ExerciseEntry) => {
  if (ex.trackingMode === 'distance') {
    const dist = ex.distance || 0;
    const weight = ex.weight || 0;
    const sets = ex.sets || 0;
    return sets * (dist / 100) * weight;
  }
  if (ex.trackingMode === 'time') {
    const time = ex.time || 0;
    const weight = ex.weight || 0;
    const sets = ex.sets || 0;
    return sets * time * weight;
  }
  if (ex.usePerSetWeights && ex.perSetWeights && ex.perSetWeights.length > 0) {
    return ex.perSetWeights.reduce((sum: number, w: number) => sum + ((ex.reps || 0) * w), 0);
  }
  return (ex.sets || 0) * (ex.reps || 0) * (ex.weight || 0);
};

export function useDashboardData() {
  const { user } = useFirebase();
  const [data, setData] = useState<{
    workouts: Workout[];
    loading: boolean;
  }>({
    workouts: [],
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setData({ workouts: [], loading: false });
      return;
    }

    const unsubscribe = storage.subscribeToWorkouts(user.uid, (workouts) => {
      setData({ workouts, loading: false });
    });

    return () => unsubscribe();
  }, [user]);

  const weeklyWorkouts = data.workouts.filter(w => {
    const d = new Date(w.date);
    return d >= startOfWeek(new Date(), { weekStartsOn: 0 }) && d <= endOfWeek(new Date(), { weekStartsOn: 0 });
  });

  // Calculate Weekly Volume
  const weeklyVolume: Record<string, number> = {};
  weeklyWorkouts.forEach(w => {
    (w.exercises || []).forEach(ex => {
      const volume = calculateExerciseVolume(ex);
      if (volume === 0) return;

      let distribution = ex.muscleDistribution;
      if (!distribution || distribution.length === 0) {
        const libraryEx = INITIAL_EXERCISES.find(le => le.name === ex.name);
        if (libraryEx && libraryEx.muscleDistribution && libraryEx.muscleDistribution.length > 0) {
          distribution = libraryEx.muscleDistribution;
        } else {
          distribution = [{ group: ex.muscleGroup, percent: 100 }];
        }
      }

      distribution.forEach(d => {
        const groupVol = volume * (d.percent / 100);
        weeklyVolume[d.group] = (weeklyVolume[d.group] || 0) + groupVol;
      });
    });
  });

  // Calculate Recent PRs (simplified)
  const prs = (data.workouts as Workout[])
    .flatMap(w => w.exercises)
    .reduce((acc: Record<string, any>, ex: ExerciseEntry) => {
      const key = ex.name;
      const weight = ex.weight || 0;
      if (!acc[key] || weight > acc[key].weight) {
        acc[key] = { name: ex.name, weight, date: '' }; // Date tracking needs improvement
      }
      return acc;
    }, {} as Record<string, any>);

  const recentPRs = Object.values(prs)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  // Recent Activity
  const recentActivity = [...data.workouts]
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.timestamp || 0) - (a.timestamp || 0);
    })
    .slice(0, 5);

  return {
    ...data,
    weeklyWorkouts,
    weeklyVolume,
    recentPRs,
    recentActivity,
  };
}
