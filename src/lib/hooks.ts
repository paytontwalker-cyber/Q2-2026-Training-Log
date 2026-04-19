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
    return d >= startOfWeek(new Date()) && d <= endOfWeek(new Date());
  });

  // Calculate Weekly Volume
  const weeklyVolume: Record<string, number> = {};
  weeklyWorkouts.forEach(w => {
    (w.exercises || []).forEach(ex => {
      const volume = (ex.weight || 0) * (ex.reps || 0) * (ex.sets || 0);
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
  const recentActivity = data.workouts.slice(0, 5);

  return {
    ...data,
    weeklyWorkouts,
    weeklyVolume,
    recentPRs,
    recentActivity,
  };
}
