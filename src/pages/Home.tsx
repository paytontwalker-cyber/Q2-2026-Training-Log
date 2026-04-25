import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, History, Dumbbell, LineChart, HeartPulse, Settings, X, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardData } from '@/src/lib/hooks';
import { BodyMap } from '@/src/components/BodyMap';
import { format } from 'date-fns';
import { INITIAL_EXERCISES } from '@/src/constants';
import { useFirebase } from '@/src/components/FirebaseProvider';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { computeVolumeTargets } from '@/src/lib/volumeTargets';

import { resolveExerciseDistribution } from '@/src/lib/exerciseDistribution';
import { calculateLoggedExerciseVolume, flattenLoggedExercises } from '@/src/lib/workoutUtils';

const normalizeMuscleName = (name: string) => String(name || '').trim().toLowerCase();

export default function Home({ setCurrentPage }: { setCurrentPage: (page: any) => void }) {
  const { user } = useFirebase();
  const [userProfile, setUserProfile] = useState<any>(null);
  const { weeklyVolume, recentPRs, recentActivity, loading, weeklyWorkouts, library } = useDashboardData();
  const [drilldownMuscle, setDrilldownMuscle] = useState<string | null>(null);
  const [homeHeatMode, setHomeHeatMode] = useState<'target' | 'relative'>('target');
  
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        setUserProfile(snap.data());
      }
    });
    return () => unsubscribe();
  }, [user]);

  const homeVolumeTargets = useMemo(() => computeVolumeTargets(userProfile), [userProfile]);

  const today = format(new Date(), 'EEEE, MMMM d');

  const navItems = [
    { id: 'log', label: 'Daily Log', icon: LayoutDashboard },
    { id: 'programming', label: 'Programming', icon: Dumbbell },
    { id: 'progress', label: 'Progress', icon: LineChart },
    { id: 'history', label: 'History', icon: History },
    { id: 'wellness', label: 'Health/Wellness', icon: HeartPulse },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const muscleDrilldownData = useMemo(() => {
    if (!drilldownMuscle) return null;

    const exerciseMap: Record<string, { name: string; volume: number; sessions: any[] }> = {};
    const targetNormalized = normalizeMuscleName(drilldownMuscle);

    weeklyWorkouts.forEach(w => {
      flattenLoggedExercises(w.exercises || []).forEach(ex => {
        const totalExerciseVolume = calculateLoggedExerciseVolume(ex);
        if (totalExerciseVolume <= 0) return;

        const distribution = resolveExerciseDistribution(ex, library);

          distribution.forEach((d: any) => {
            const groupName = d.group || '';
            if (normalizeMuscleName(groupName) !== targetNormalized) return;

            const percent = Number(d.percent || 0);
            if (percent <= 0) return;

            const contributedVolume = totalExerciseVolume * (percent / 100);
            if (contributedVolume <= 0) return;

            const exerciseName = ex.name || 'Unnamed Exercise';

            if (!exerciseMap[exerciseName]) {
              exerciseMap[exerciseName] = { name: exerciseName, volume: 0, sessions: [] };
            }
            exerciseMap[exerciseName].volume += contributedVolume;
            exerciseMap[exerciseName].sessions.push({
              workoutName: w.workoutName || 'Workout',
              date: w.date,
              volume: contributedVolume,
            });
          });
      });
    });

    const exercises = Object.values(exerciseMap).sort((a, b) => b.volume - a.volume);
    const totalVolume = exercises.reduce((sum, ex) => sum + ex.volume, 0);

    return { muscleGroup: drilldownMuscle, totalVolume, exercises };
  }, [drilldownMuscle, weeklyWorkouts, library]);

  if (loading) return <div>Loading...</div>;

  const sortedMuscleGroupData = Object.entries<number>(weeklyVolume)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">{today}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {navItems.map((item) => (
          <Button 
            key={item.id} 
            variant="outline" 
            className="h-auto py-3 flex flex-col gap-1.5 border-border hover:border-maroon hover:text-maroon"
            onClick={() => setCurrentPage(item.id)}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-semibold uppercase">{item.label}</span>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-shell p-4">
          <h3 className="section-title mb-4">Recent PRs</h3>
          <ul className="space-y-3">
            {recentPRs.map((pr, i) => (
              <li key={i} className="flex justify-between items-center text-sm">
                <span className="font-medium text-foreground">{pr.name}</span>
                <span className="font-bold text-maroon bg-maroon/5 px-2 py-1 rounded-md">{pr.weight} kg</span>
              </li>
            ))}
            {recentPRs.length === 0 && (
              <li className="text-sm text-muted-foreground italic">No recent PRs.</li>
            )}
          </ul>
        </div>
        <div className="card-shell p-4">
          <h3 className="section-title mb-4">Recent Activity</h3>
          <ul className="space-y-3">
            {recentActivity.map((w, i) => (
              <li key={i} className="flex justify-between items-center text-sm">
                <span className="font-medium text-foreground line-clamp-1">{w.workoutName}</span>
                <span className="text-muted-foreground text-xs font-medium whitespace-nowrap bg-muted px-2 py-1 rounded-md">{format(new Date(w.date), 'MMM d')}</span>
              </li>
            ))}
            {recentActivity.length === 0 && (
              <li className="text-sm text-muted-foreground italic">No recent activity.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="card-shell">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20">
          <h3 className="section-title">Weekly Training Intensity</h3>
          <div className="flex items-center gap-2">
            <span className="label-micro">
              Heat Mode
            </span>
            <Select value={homeHeatMode} onValueChange={(value) => setHomeHeatMode(value as 'target' | 'relative')}>
              <SelectTrigger className="input-standard h-8 w-[130px] font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="target">Target</SelectItem>
                <SelectItem value="relative">Relative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="p-4">
          <BodyMap 
            muscleGroupData={sortedMuscleGroupData} 
            heatMode={homeHeatMode}
            volumeTargets={homeVolumeTargets}
            onMuscleClick={setDrilldownMuscle} 
          />
        </div>
      </div>

      {drilldownMuscle && muscleDrilldownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Hash className="text-maroon" size={18} />
                <h3 className="font-bold text-foreground">
                  {muscleDrilldownData.muscleGroup} Volume Breakdown
                </h3>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setDrilldownMuscle(null)}>
                <X size={16} />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <div className="mb-6 p-4 rounded-xl bg-muted border border-border flex items-center justify-between">
                <span className="font-medium text-foreground">Total Weekly Volume</span>
                <span className="text-xl font-black text-maroon">
                  {Math.round(muscleDrilldownData.totalVolume).toLocaleString()} lbs
                </span>
              </div>
              
              <div className="space-y-3">
                <h4 className="label-micro mb-3">Contributing Exercises</h4>
                
                {muscleDrilldownData.exercises.length > 0 ? (
                  muscleDrilldownData.exercises.map(ex => (
                    <div key={ex.name} className="soft-panel shadow-sm bg-card">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm text-foreground">{ex.name}</span>
                        <span className="font-mono text-sm font-bold text-gold">
                          {Math.round(ex.volume).toLocaleString()} lbs
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mb-2 overflow-hidden">
                        <div 
                          className="bg-gold h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, (ex.volume / muscleDrilldownData.totalVolume) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    No contributing exercises found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
