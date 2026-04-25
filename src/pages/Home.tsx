import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, History, Dumbbell, LineChart, HeartPulse, Settings, X, Hash, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardData } from '@/src/lib/hooks';
import { BodyMap, getVolumeColor, THERMAL_COLORS } from '@/src/components/BodyMap';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfToday } from 'date-fns';
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
  const { weeklyVolume, recentPRs, recentActivity, loading, weeklyWorkouts, library, workouts, splits } = useDashboardData();
  const [drilldownMuscle, setDrilldownMuscle] = useState<string | null>(null);
  const [homeHeatMode, setHomeHeatMode] = useState<'target' | 'relative'>('target');

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  
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

  const maxVolume = useMemo(() => {
    return Math.max(0, ...sortedMuscleGroupData.map(d => d.value));
  }, [sortedMuscleGroupData]);

  const renderCalendarDays = () => {
    const days = [];
    const dateFormat = "EEEE";
    let startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-[10px] font-bold text-center uppercase text-muted-foreground mb-2" key={i}>
          {format(addDays(startDate, i), dateFormat).substring(0, 3)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 gap-1">{days}</div>;
  };

  const renderCalendarCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        const dateStr = format(day, "yyyy-MM-dd");
        const dayOfWeek = format(day, "EEEE");
        
        const completed = workouts.filter(w => format(new Date(w.date), "yyyy-MM-dd") === dateStr);
        const planned = splits?.find(s => s.day === dayOfWeek && s.name && s.name !== 'Rest' && s.name !== 'Off');

        const isTodayMarker = isToday(day);
        const isSelectedMarker = isSameDay(day, selectedDate);
        const isSameMonthMarker = isSameMonth(day, monthStart);

        days.push(
          <div
            className={`p-1 min-h-[50px] border rounded-md cursor-pointer transition-colors relative flex flex-col gap-0.5
              ${!isSameMonthMarker ? "border-transparent bg-muted/10 opacity-50" : "border-border/50 bg-card hover:border-maroon/50"}
              ${isSelectedMarker ? "ring-1 ring-maroon bg-maroon/5 border-maroon" : ""}
              ${isTodayMarker && !isSelectedMarker ? "border-maroon/50" : ""}
            `}
            key={day.toString()}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <span className={`text-[10px] font-semibold text-right w-full block ${isTodayMarker ? 'text-maroon' : 'text-muted-foreground'}`}>{formattedDate}</span>
            <div className="flex flex-col gap-1 overflow-hidden h-full">
               {completed.map((w, idx) => (
                 <div key={idx} className="bg-maroon text-white text-[8px] font-bold px-1 py-0.5 rounded truncate" title={w.workoutName || 'Workout'}>
                   {w.workoutName || 'Workout'}
                 </div>
               ))}
               {completed.length === 0 && day >= startOfToday() && planned && (
                 <div className="border border-amber-600/30 text-amber-600 bg-amber-50 text-[8px] font-bold px-1 py-0.5 rounded truncate" title={planned.name}>
                   {planned.name}
                 </div>
               )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 mb-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDayOfWeek = format(selectedDate, "EEEE");
  const selectedCompleted = workouts.filter(w => format(new Date(w.date), "yyyy-MM-dd") === selectedDateStr);
  const selectedPlanned = splits?.find(s => s.day === selectedDayOfWeek && s.name && s.name !== 'Rest' && s.name !== 'Off');

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">{today}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-shell p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="text-maroon" size={20} />
                <h3 className="section-title text-base">{format(currentMonth, "MMMM yyyy")}</h3>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={16} /></Button>
                <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-bold" onClick={() => setCurrentMonth(startOfMonth(new Date()))}>Today</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={16} /></Button>
              </div>
            </div>
            {renderCalendarDays()}
            {renderCalendarCells()}
          </div>

          <div className="card-shell p-4 bg-muted/20">
            <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-3 border-b border-border pb-2">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h4>
            {selectedCompleted.length > 0 ? (
              <div className="space-y-2">
                {selectedCompleted.map((w, i) => (
                  <div key={i} className="flex items-center justify-between bg-card p-3 rounded-md border border-border">
                    <span className="font-semibold text-sm">{w.workoutName || 'Workout'}</span>
                    <span className="text-[10px] font-bold text-maroon bg-maroon/5 px-2 py-1 rounded">Logged</span>
                  </div>
                ))}
              </div>
            ) : selectedDate >= startOfToday() && selectedPlanned ? (
              <div className="flex items-center justify-between bg-amber-50 p-3 rounded-md border border-amber-600/30">
                <span className="font-semibold text-sm text-amber-900">{selectedPlanned.name}</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-600/10 px-2 py-1 rounded">Planned</span>
              </div>
            ) : (
              <div className="text-center p-4 text-sm text-muted-foreground italic">
                No activity scheduled or logged.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
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

      <div className="card-shell mt-6 p-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider border-b border-border pb-2">Muscle Group Volumes</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sortedMuscleGroupData.map(data => {
            let color = '#E5E7EB'; // NO_DATA_COLOR
            if (data.value > 0) {
              if (homeHeatMode === 'target') {
                const target = homeVolumeTargets[data.name] || 0;
                const ratio = target > 0 ? (data.value / target) * 100 : (maxVolume > 0 ? (data.value / maxVolume) * 100 : 0);
                color = getVolumeColor(ratio);
              } else {
                const ratio = maxVolume > 0 ? (data.value / maxVolume) * 100 : 0;
                color = getVolumeColor(ratio);
              }
            }
            
            return (
              <button
                key={data.name}
                type="button"
                onClick={() => setDrilldownMuscle(data.name)}
                className={`w-full text-left rounded-xl border border-border bg-card/70 px-4 py-3 shadow-sm transition-all cursor-pointer hover:border-maroon/40 hover:bg-maroon/5`}
              >
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full shrink-0 shadow-sm border border-border" style={{ backgroundColor: color }} />
                  <div className="min-w-0">
                    <div className="font-bold text-foreground truncate">{data.name}</div>
                    <div className="text-sm text-muted-foreground tabular-nums">
                      {data.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} lbs moved
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
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
