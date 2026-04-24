import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, History, Dumbbell, LineChart, HeartPulse, Users, Settings, X, Hash } from 'lucide-react';
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

const calculateVolume = (ex: any) => {
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
  return ex.sets * (ex.reps || 0) * (ex.weight || 0);
};

const getExerciseDistribution = (ex: any) => {
  let distribution = ex.muscleDistribution;
  if (!distribution || distribution.length === 0) {
    const libraryEx = INITIAL_EXERCISES.find(le => le.name === ex.name);
    if (libraryEx?.muscleDistribution?.length) {
      distribution = libraryEx.muscleDistribution;
    } else if (ex.muscleGroup) {
      distribution = [{ group: ex.muscleGroup, percent: 100 }];
    } else {
      distribution = [{ group: 'Other', percent: 100 }];
    }
  }
  return distribution;
};

export default function Home({ setCurrentPage }: { setCurrentPage: (page: any) => void }) {
  const { user } = useFirebase();
  const [userProfile, setUserProfile] = useState<any>(null);
  const { weeklyVolume, recentPRs, recentActivity, loading, weeklyWorkouts } = useDashboardData();
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
    { id: 'social', label: 'Social', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings, fullWidth: true }
  ];

  const muscleDrilldownData = useMemo(() => {
    if (!drilldownMuscle) return null;

    const exerciseMap: Record<string, { name: string; volume: number; sessions: any[] }> = {};

    weeklyWorkouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        const totalExerciseVolume = calculateVolume(ex);
        const distribution = getExerciseDistribution(ex);

        distribution.forEach((d: any) => {
          if (d.group !== drilldownMuscle) return;

          const contributedVolume = totalExerciseVolume * ((d.percent || 0) / 100);
          if (contributedVolume <= 0) return;

          if (!exerciseMap[ex.name]) {
            exerciseMap[ex.name] = { name: ex.name, volume: 0, sessions: [] };
          }
          exerciseMap[ex.name].volume += contributedVolume;
          exerciseMap[ex.name].sessions.push({
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
  }, [drilldownMuscle, weeklyWorkouts]);

  if (loading) return <div>Loading...</div>;

  const sortedMuscleGroupData = Object.entries<number>(weeklyVolume)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6 pb-20 relative">
      <header className="py-4">
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1 font-medium">{today}</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {navItems.map((item) => (
          <Button 
            key={item.id} 
            variant="outline" 
            className={"h-auto py-3 flex flex-col gap-1.5 border-border hover:border-maroon hover:text-maroon " + (item.fullWidth ? "col-span-3 md:col-span-1" : "")}
            onClick={() => setCurrentPage(item.id)}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-semibold uppercase">{item.label}</span>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TODO: Wire Home exercise drilldown once weekly workout entries are exposed to Home. */}
        <Card className="border-border">
          <CardHeader><CardTitle className="text-lg">Recent PRs</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentPRs.map((pr, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{pr.name}</span>
                  <span className="font-bold text-maroon">{pr.weight} kg</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentActivity.map((w, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{w.workoutName}</span>
                  <span className="text-muted-foreground">{format(new Date(w.date), 'MMM d')}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">Weekly Training Intensity</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Heat Mode
            </span>
            <Select value={homeHeatMode} onValueChange={(value) => setHomeHeatMode(value as 'target' | 'relative')}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="target">Target</SelectItem>
                <SelectItem value="relative">Relative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <BodyMap 
            muscleGroupData={sortedMuscleGroupData} 
            heatMode={homeHeatMode}
            volumeTargets={homeVolumeTargets}
            onMuscleClick={setDrilldownMuscle} 
          />
        </CardContent>
      </Card>

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
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Contributing Exercises</h4>
                
                {muscleDrilldownData.exercises.length > 0 ? (
                  muscleDrilldownData.exercises.map(ex => (
                    <div key={ex.name} className="p-3 rounded-lg border border-border bg-card shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm text-foreground">{ex.name}</span>
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
