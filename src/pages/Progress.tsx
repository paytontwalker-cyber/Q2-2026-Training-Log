/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { LineChart as LineChartIcon, TrendingUp, Trophy, Activity, Hash, Calendar, Dumbbell, PieChart as PieChartIcon, Timer, MapPin, Zap } from 'lucide-react';
import { format, subDays, startOfDay, isAfter, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ExerciseSelector } from '@/src/components/ExerciseSelector';
import { INITIAL_EXERCISES, MUSCLE_VOLUME_TARGETS } from '@/src/constants';
import { Workout } from '@/src/types';
import { storage } from '@/src/services/storage';
import { useFirebase } from '@/src/components/FirebaseProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { getDistanceInMeters } from '../lib/workoutUtils';
import { BodyMap } from '@/src/components/BodyMap';

export default function Progress() {
  const { user } = useFirebase();
  const [view, setView] = useState<'weekly-volume' | 'session-volume' | 'strength' | 'conditioning' | 'battery'>('weekly-volume');
  const [volumeRange, setVolumeRange] = useState<'24h' | '72h' | '1w' | '2w' | '1m' | '3m'>('1w');
  const [heatMode, setHeatMode] = useState<'relative' | 'target'>('relative');
  const [selectedExercise, setSelectedExercise] = useState(INITIAL_EXERCISES[5].name); // Flat Bench Press
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [history, setHistory] = useState<Workout[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = storage.subscribeToWorkouts(user.uid, (data) => {
      setHistory(data);
    });
    return () => unsubscribe();
  }, [user]);

  const timeToSeconds = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.trim().split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    if (parts.length === 1) {
      const val = parseInt(parts[0]);
      return isNaN(val) ? null : val;
    }
    return null;
  };

  const secondsToTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateVolume = (ex: any) => {
    if (ex.trackingMode === 'distance') {
      // Distance-based volume: sets * (distance / 100) * weight
      // This provides a normalized load metric that isn't overly inflated
      const dist = ex.distance || 0;
      const weight = ex.weight || 0;
      const sets = ex.sets || 0;
      return sets * (dist / 100) * weight;
    }
    if (ex.trackingMode === 'time') {
      // Time-based volume: sets * time * weight
      const time = ex.time || 0;
      const weight = ex.weight || 0;
      const sets = ex.sets || 0;
      return sets * time * weight;
    }
    if (ex.usePerSetWeights && ex.perSetWeights && ex.perSetWeights.length > 0) {
      // Use actual logged weights * reps
      return ex.perSetWeights.reduce((sum: number, w: number) => sum + ((ex.reps || 0) * w), 0);
    }
    return ex.sets * (ex.reps || 0) * (ex.weight || 0);
  };

  const chartData = useMemo(() => {
    return history
      .filter(w => w && (w.exercises || []).some(ex => ex.name === selectedExercise))
      .map(w => {
        const ex = (w.exercises || []).find(e => e.name === selectedExercise)!;
        return {
          date: format(new Date(w.date), 'MMM dd'),
          fullDate: new Date(w.date),
          weight: ex.weight,
          volume: calculateVolume(ex),
          rpe: ex.rpe,
        };
      })
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
  }, [history, selectedExercise]);

  const summary = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const latest = chartData[chartData.length - 1];
    const highestWeight = Math.max(...chartData.map(d => d.weight));
    
    return {
      latestWeight: latest.weight,
      highestWeight: highestWeight,
      latestVolume: latest.volume,
      totalSessions: chartData.length
    };
  }, [chartData]);

  const selectedWorkout = useMemo(() => {
    if (history.length === 0) return null;
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return selectedWorkoutId ? history.find(w => w.id === selectedWorkoutId) || sortedHistory[0] : sortedHistory[0];
  }, [history, selectedWorkoutId]);

  // A. Most Recent Workout Volume Summary
  const latestWorkoutSummary = useMemo(() => {
    if (!selectedWorkout) return null;
    const latest = selectedWorkout;
    
    let totalVolume = 0;
    const muscleGroupVolume: Record<string, number> = {};
    const exerciseVolume: Record<string, number> = {};

    (latest.exercises || []).forEach(ex => {
      const vol = calculateVolume(ex);
      totalVolume += vol;
      
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
        const groupVol = vol * (d.percent / 100);
        muscleGroupVolume[d.group] = (muscleGroupVolume[d.group] || 0) + groupVol;
      });

      exerciseVolume[ex.name] = (exerciseVolume[ex.name] || 0) + vol;
    });

    const muscleGroupData = Object.entries(muscleGroupVolume)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const exerciseData = Object.entries(exerciseVolume)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      date: format(new Date(latest.date), 'PPP'),
      name: latest.workoutName,
      exercises: (latest.exercises || []).map(ex => ({
        name: ex.name,
        volume: calculateVolume(ex)
      })),
      totalVolume,
      muscleGroupData,
      exerciseData
    };
  }, [selectedWorkout]);

  // B. Weekly Volume Section
  const weeklyVolume = useMemo(() => {
    if (history.length === 0) return null;
    
    let cutoffDate = new Date();
    switch (volumeRange) {
      case '24h':
        cutoffDate = subDays(new Date(), 1);
        break;
      case '72h':
        cutoffDate = subDays(new Date(), 3);
        break;
      case '1w':
        cutoffDate = startOfDay(subDays(new Date(), 7));
        break;
      case '2w':
        cutoffDate = startOfDay(subDays(new Date(), 14));
        break;
      case '1m':
        cutoffDate = startOfDay(subDays(new Date(), 30));
        break;
      case '3m':
        cutoffDate = startOfDay(subDays(new Date(), 90));
        break;
    }
    
    const recentWorkouts = history.filter(w => isAfter(new Date(w.date), cutoffDate));
    
    let totalBodyVolume = 0;
    const muscleGroupVolume: Record<string, number> = {};
    const exerciseVolume: Record<string, number> = {};

    recentWorkouts.forEach(w => {
      if (!w) return;
      (w.exercises || []).forEach(ex => {
        const vol = calculateVolume(ex);
        totalBodyVolume += vol;
        
        // Get distribution with fallbacks
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
          const groupVol = vol * (d.percent / 100);
          muscleGroupVolume[d.group] = (muscleGroupVolume[d.group] || 0) + groupVol;
        });

        exerciseVolume[ex.name] = (exerciseVolume[ex.name] || 0) + vol;
      });
    });

    const muscleGroupData = Object.entries(muscleGroupVolume)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const exerciseData = Object.entries(exerciseVolume)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalBodyVolume,
      muscleGroupData,
      exerciseData
    };
  }, [history, volumeRange]);

  const volumeTargets = useMemo(() => {
    if (!weeklyVolume) return null;
    
    // Alias map for muscle group labels to match MUSCLE_VOLUME_TARGETS
    const aliasMap: Record<string, string> = {
      'Upper Back': 'Back',
      'Lats': 'Back',
      'Traps': 'Back',
      'Lower Back': 'Back',
      'Core': 'Abs/Core',
    };

    return Object.entries(MUSCLE_VOLUME_TARGETS).map(([muscleGroup, targetVolume]) => {
      // Find the actual volume from weeklyVolume.muscleGroupData
      const actualVolume = weeklyVolume.muscleGroupData
        .filter(d => d.name === muscleGroup || aliasMap[d.name] === muscleGroup)
        .reduce((sum, d) => sum + d.value, 0);

      const percentOfTarget = targetVolume > 0 ? (actualVolume / targetVolume) * 100 : 0;
      
      let status = 'Low';
      if (percentOfTarget >= 120) status = 'Above Zone';
      else if (percentOfTarget >= 100) status = 'On Target';
      else if (percentOfTarget >= 70) status = 'Near';
      
      return {
        muscleGroup,
        actualVolume,
        targetVolume,
        percentOfTarget,
        growthZoneUpper: targetVolume * 1.2,
        status
      };
    });
  }, [weeklyVolume]);

  // D. Strength Section - Latest Strength Summary
  const latestStrengthSummary = useMemo(() => {
    if (!selectedWorkout) return null;
    const latest = selectedWorkout;
    
    return {
      date: format(new Date(latest.date), 'PPP'),
      exercises: (latest.exercises || []).map(ex => ({
        name: ex.name,
        weight: ex.usePerSetWeights && ex.perSetWeights && ex.perSetWeights.length > 0 ? Math.max(...ex.perSetWeights) : ex.weight
      }))
    };
  }, [selectedWorkout]);

  // Running Analytics
  const runningAnalytics = useMemo(() => {
    const runningWorkouts = history.filter(w => w.conditioning?.type);
    if (runningWorkouts.length === 0) return null;

    const sortedRunning = [...runningWorkouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let totalMetersSum = 0;
    let totalDurationSecondsSum = 0;
    const typeCounts: Record<string, number> = {};
    
    const paceHistory = sortedRunning.map(w => {
      const c = w.conditioning!;
      const meters = getDistanceInMeters(c);
      const dur = timeToSeconds(c.workDuration || '0') || 0;
      const multiplier = (c.type === 'Repeats' && c.reps && c.reps > 0) ? c.reps : 1;
      
      const totalMeters = meters * multiplier;
      const totalDur = dur * multiplier;
      
      totalMetersSum += totalMeters;
      totalDurationSecondsSum += totalDur;
      if (c.type) typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;

      let avgPaceSec = 0;
      if (totalMeters > 0 && totalDur > 0) {
        // Pace per mile
        avgPaceSec = totalDur / (totalMeters / 1609.34);
      } else if (c.averagePace) {
        avgPaceSec = timeToSeconds(c.averagePace) || 0;
      }

      return {
        date: format(new Date(w.date), 'MMM dd'),
        fullDate: new Date(w.date),
        type: c.type,
        distanceMeters: totalMeters,
        distanceMiles: totalMeters / 1609.34,
        duration: totalDur,
        pace: avgPaceSec,
        paceStr: avgPaceSec > 0 ? secondsToTime(avgPaceSec) : null
      };
    });

    const repeatHistory = sortedRunning
      .filter(w => w.conditioning?.type === 'Repeats' && w.conditioning.actualSplits?.length)
      .map(w => {
        const c = w.conditioning!;
        const splits = c.actualSplits!.map(s => timeToSeconds(s)).filter((s): s is number => s !== null);
        const avgSplit = splits.length > 0 ? splits.reduce((a, b) => a + b, 0) / splits.length : 0;
        const bestSplit = splits.length > 0 ? Math.min(...splits) : 0;

        return {
          date: format(new Date(w.date), 'MMM dd'),
          fullDate: new Date(w.date),
          avgSplit,
          bestSplit,
          avgSplitStr: avgSplit > 0 ? secondsToTime(avgSplit) : null,
          bestSplitStr: bestSplit > 0 ? secondsToTime(bestSplit) : null
        };
      });

    const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    return {
      totalMiles: totalMetersSum / 1609.34,
      totalDurationSeconds: totalDurationSecondsSum,
      totalSessions: runningWorkouts.length,
      paceHistory,
      repeatHistory,
      typeData
    };
  }, [history]);

  // Body Battery Logic
  const bodyBattery = useMemo(() => {
    if (history.length === 0) return null;
    
    const now = new Date();
    const sevenDaysAgo = startOfDay(subDays(now, 7));
    const recentWorkouts = history.filter(w => isAfter(new Date(w.date), sevenDaysAgo));
    
    if (recentWorkouts.length === 0) return { score: 100, status: 'High', sessions: 0, liftingLoad: '0', conditioningLoad: '0', avgRPE: 'N/A', avgEnergy: '0', recentImpact: 'None', topDrivers: [] };

    // 1. Lifting Load
    let liftingLoad = 0;
    recentWorkouts.forEach(w => {
      if (!w) return;
      (w.exercises || []).forEach(ex => {
        liftingLoad += calculateVolume(ex);
      });
    });

    // 2. Conditioning Load
    let conditioningLoad = 0;
    recentWorkouts.forEach(w => {
      if (w.conditioning?.type) {
        // Simple conditioning load: duration * intensity factor
        const dur = timeToSeconds(w.conditioning.workDuration || '0') || 0;
        conditioningLoad += dur * 1.5; // 1.5 factor for conditioning intensity
      }
    });

    // 3. RPE Impact
    const allLoggedRPEs = recentWorkouts.flatMap(w => 
      (w.exercises || []).flatMap(ex => [ex.rpe, ex.superset?.rpe])
    ).filter((rpe): rpe is number => typeof rpe === 'number' && !isNaN(rpe));
    const avgRPE = allLoggedRPEs.length > 0 ? allLoggedRPEs.reduce((a, b) => a + b, 0) / allLoggedRPEs.length : 0;

    // 4. Energy Levels
    const avgEnergy = recentWorkouts.reduce((acc, w) => acc + (w.postWorkoutEnergy || 5), 0) / recentWorkouts.length;

    // 5. Recency Weighting
    const fortyEightHoursAgo = subDays(now, 2);
    const veryRecentWorkouts = recentWorkouts.filter(w => isAfter(new Date(w.date), fortyEightHoursAgo)).length;

    let score = 100;
    score -= Math.min(30, (liftingLoad / 10000) * 5); 
    score -= Math.min(30, (conditioningLoad / 500) * 5);
    score -= Math.max(0, (avgRPE - 6) * 5);
    score -= recentWorkouts.length * 3;
    score += (avgEnergy - 5) * 4;
    score -= veryRecentWorkouts * 10;

    score = Math.max(5, Math.min(100, Math.round(score)));

    let status = 'High';
    if (score < 40) status = 'Low';
    else if (score < 75) status = 'Moderate';

    const topDrivers = [];
    if (liftingLoad > 15000) topDrivers.push('High Lifting Load');
    if (conditioningLoad > 600) topDrivers.push('High Conditioning Load');
    if (avgRPE > 8) topDrivers.push('High Intensity');
    if (veryRecentWorkouts > 1) topDrivers.push('High Frequency');

    return {
      score,
      status,
      avgRPE: allLoggedRPEs.length > 0 ? avgRPE.toFixed(1) : 'N/A',
      avgEnergy: avgEnergy.toFixed(1),
      liftingLoad: liftingLoad.toLocaleString(),
      conditioningLoad: conditioningLoad.toLocaleString(),
      sessions: recentWorkouts.length,
      recentImpact: veryRecentWorkouts > 0 ? 'High' : 'Low',
      topDrivers
    };
  }, [history]);

  const COLORS = [
    '#800000', '#D4AF37', '#1e293b', '#64748b', '#94a3b8', '#cbd5e1',
    '#475569', '#94a3b8', '#e2e8f0', '#0f172a', '#334155', '#1e293b',
    '#020617', '#1e1b4b', '#312e81', '#4338ca', '#5850ec'
  ];

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Progress Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive analysis of your training data</p>
        </div>
        
        <div className="flex bg-muted p-1 rounded-lg border border-border w-fit">
          <button 
            onClick={() => setView('weekly-volume')}
            className={cn(
              "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
              view === 'weekly-volume' ? "bg-card text-maroon shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Weekly Volume
          </button>
          <button 
            onClick={() => setView('session-volume')}
            className={cn(
              "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
              view === 'session-volume' ? "bg-card text-maroon shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Session Volume
          </button>
          <button 
            onClick={() => setView('strength')}
            className={cn(
              "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
              view === 'strength' ? "bg-card text-maroon shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Strength
          </button>
          <button 
            onClick={() => setView('conditioning')}
            className={cn(
              "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
              view === 'conditioning' ? "bg-card text-maroon shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Conditioning
          </button>
          <button 
            onClick={() => setView('battery')}
            className={cn(
              "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
              view === 'battery' ? "bg-card text-maroon shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Body Battery
          </button>
        </div>
      </header>

      {view === 'weekly-volume' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-gold" size={20} />
              <h3 className="text-xl font-bold text-slate-800">
                Volume ({
                  volumeRange === '24h' ? 'Last 24h' :
                  volumeRange === '72h' ? 'Last 72h' :
                  volumeRange === '1w' ? '1 Week' :
                  volumeRange === '2w' ? '2 Weeks' :
                  volumeRange === '1m' ? '1 Month' :
                  '3 Months'
                })
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500 uppercase font-bold">Time Range</Label>
                <Select value={volumeRange} onValueChange={(v: any) => setVolumeRange(v)}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24h</SelectItem>
                    <SelectItem value="72h">Last 72h</SelectItem>
                    <SelectItem value="1w">1 Week</SelectItem>
                    <SelectItem value="2w">2 Weeks</SelectItem>
                    <SelectItem value="1m">1 Month</SelectItem>
                    <SelectItem value="3m">3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500 uppercase font-bold">Heat Mode</Label>
                <Select value={heatMode} onValueChange={(v: any) => setHeatMode(v)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relative">Relative Heat</SelectItem>
                    <SelectItem value="target">Target Heat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {weeklyVolume && weeklyVolume.totalBodyVolume > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-slate-200 shadow-sm lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Total Body Volume</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <div className="text-4xl font-black text-maroon mb-2">
                    {weeklyVolume.totalBodyVolume.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Total Lbs Moved</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Muscle Group Split</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={weeklyVolume.muscleGroupData}
                          cx="50%"
                          cy="40%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {weeklyVolume.muscleGroupData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => {
                            const total = weeklyVolume.muscleGroupData.reduce((sum, entry) => sum + entry.value, 0);
                            const percent = ((value / total) * 100).toFixed(1);
                            return [`${value.toLocaleString()} lbs (${percent}%)`, name];
                          }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    {weeklyVolume.muscleGroupData.slice(0, 6).map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate text-slate-600">{entry.name}</span>
                        <span className="ml-auto font-bold text-slate-900">{((entry.value / weeklyVolume.totalBodyVolume) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Top Exercises</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weeklyVolume.exerciseData.slice(0, 4).map((ex, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium truncate w-32">{ex.name}</span>
                          <span className="text-slate-400">{((ex.value / weeklyVolume.totalBodyVolume) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-maroon h-full" 
                            style={{ width: `${(ex.value / weeklyVolume.totalBodyVolume) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-slate-200 shadow-sm p-8 text-center text-slate-400 italic">
              Log workouts in the selected range to see volume breakdowns.
            </Card>
          )}

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-slate-500">
                Weekly Volume Heatmap
              </CardTitle>
              <CardDescription>
                Shading reflects this week's training volume per muscle group. Hover for details.
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-2">
                {heatMode === 'relative'
                  ? 'Relative Heat compares each muscle group to your highest-volume group in the selected time range.'
                  : 'Target Heat compares each muscle group to its volume target, so colors reflect progress toward target rather than just this range’s highest group.'}
              </p>
            </CardHeader>
            <CardContent>
              {weeklyVolume && weeklyVolume.muscleGroupData.length > 0 ? (
                <BodyMap muscleGroupData={weeklyVolume.muscleGroupData} heatMode={heatMode} />
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No workout data in this range yet. Log some workouts to see your body map.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Volume Targets Section */}
          <section className="space-y-4 mt-8">
            <div className="flex items-center gap-2">
              <Trophy className="text-gold" size={20} />
              <h3 className="text-xl font-bold text-slate-800">Volume Targets</h3>
            </div>
            <p className="text-sm text-slate-500">Compare weekly muscle-group volume against your maintenance target and slight-growth zone.</p>
            
            {volumeTargets && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Groups On Target</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-black text-green-600">{volumeTargets.filter(t => t.status === 'On Target').length}</div></CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">In Growth Zone</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-black text-gold">{volumeTargets.filter(t => t.status === 'Above Zone').length}</div></CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Lowest Coverage</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-black text-red-600">{volumeTargets.sort((a,b) => a.percentOfTarget - b.percentOfTarget)[0].muscleGroup}</div></CardContent>
                  </Card>
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-slate-500">Highest Overshoot</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-black text-maroon">{volumeTargets.sort((a,b) => b.percentOfTarget - a.percentOfTarget)[0].muscleGroup}</div></CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  {volumeTargets.filter(t => t.actualVolume > 0).map((t) => (
                    <div key={t.muscleGroup} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-700">{t.muscleGroup}</span>
                        <span className="text-xs font-bold text-slate-500">{t.actualVolume.toLocaleString()} / {t.targetVolume.toLocaleString()} lbs ({t.percentOfTarget.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative">
                        <div className="bg-maroon h-full" style={{ width: `${Math.min(t.percentOfTarget, 100)}%` }} />
                        {t.percentOfTarget >= 100 && <div className="absolute top-0 right-0 bg-gold h-full" style={{ width: `${Math.min(Math.max(t.percentOfTarget - 100, 0), 20)}%` }} />}
                      </div>
                    </div>
                  ))}

                  {volumeTargets.filter(t => t.actualVolume === 0).length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mt-6">
                        <div className="flex-grow h-px bg-slate-200" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Untouched Groups</span>
                        <div className="flex-grow h-px bg-slate-200" />
                      </div>

                      {volumeTargets.filter(t => t.actualVolume === 0).map((t) => (
                        <div key={t.muscleGroup} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-500">{t.muscleGroup}</span>
                          <span className="text-xs text-slate-400">0 / {t.targetVolume.toLocaleString()} lbs (0%)</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader><CardTitle>Detailed Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {volumeTargets.filter(t => t.actualVolume > 0).map(t => (
                        <div key={t.muscleGroup} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                          <span className="font-medium text-slate-700">{t.muscleGroup}</span>
                          <span className="text-slate-500">{t.actualVolume.toLocaleString()} / {t.targetVolume.toLocaleString()} ({t.percentOfTarget.toFixed(0)}%) - <span className={cn("font-bold", t.status === 'Low' ? 'text-red-500' : t.status === 'Near' ? 'text-gold' : 'text-green-600')}>{t.status}</span></span>
                        </div>
                      ))}
                      {volumeTargets.filter(t => t.actualVolume === 0).length > 0 && (
                        <>
                          <div className="text-xs font-bold text-slate-400 uppercase pt-4 pb-2 border-t border-slate-200 mt-2">Untouched Groups</div>
                          {volumeTargets.filter(t => t.actualVolume === 0).map(t => (
                            <div key={t.muscleGroup} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0 text-slate-400">
                              <span className="font-medium">{t.muscleGroup}</span>
                              <span>0 / {t.targetVolume.toLocaleString()} (0%)</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </section>
        </section>
      )}
      {view === 'session-volume' && (
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="text-maroon" size={20} />
              <h3 className="text-xl font-bold text-slate-800">Workout Volume</h3>
            </div>
            <div className="w-full md:w-64">
              <Select value={selectedWorkoutId || (history.length > 0 ? [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].id : '')} onValueChange={setSelectedWorkoutId}>
                <SelectTrigger>
                  <span className="text-sm font-medium">Swap Log</span>
                </SelectTrigger>
                <SelectContent>
                  {history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.workoutName} ({format(new Date(w.date), 'MMM dd')})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {latestWorkoutSummary ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mt-6">
                <Hash className="text-maroon" size={20} />
                <h3 className="text-xl font-bold text-slate-800">Individual Exercise Volume</h3>
              </div>
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{latestWorkoutSummary.name}</CardTitle>
                  <CardDescription>{latestWorkoutSummary.date}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(latestWorkoutSummary.exercises || []).map((ex, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-700 truncate mr-2">{ex.name}</span>
                        <span className="text-maroon font-bold">{ex.volume.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal uppercase">Vol</span></span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-slate-200 shadow-sm lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Total Volume</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <div className="text-4xl font-black text-maroon mb-2">
                      {latestWorkoutSummary.totalVolume.toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Lbs Moved</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Muscle Group Split</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={latestWorkoutSummary.muscleGroupData}
                            cx="50%"
                            cy="40%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {latestWorkoutSummary.muscleGroupData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number, name: string, props: any) => {
                              const total = latestWorkoutSummary.muscleGroupData.reduce((sum, entry) => sum + entry.value, 0);
                              const percent = ((value / total) * 100).toFixed(1);
                              return [`${value.toLocaleString()} lbs (${percent}%)`, name];
                            }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      {latestWorkoutSummary.muscleGroupData.slice(0, 6).map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="truncate text-slate-600">{entry.name}</span>
                          <span className="ml-auto font-bold text-slate-900">{((entry.value / latestWorkoutSummary.totalVolume) * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Top Exercises</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {latestWorkoutSummary.exerciseData.slice(0, 4).map((ex, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600 font-medium truncate w-32">{ex.name}</span>
                            <span className="text-slate-400">{((ex.value / latestWorkoutSummary.totalVolume) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-maroon h-full" 
                              style={{ width: `${(ex.value / latestWorkoutSummary.totalVolume) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="border-slate-200 shadow-sm p-8 text-center text-slate-400 italic">
              No workouts logged yet.
            </Card>
          )}
        </section>
      )}
      {view === 'strength' && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Dumbbell className="text-slate-700" size={20} />
              <h3 className="text-xl font-bold text-slate-800">Strength Analysis</h3>
            </div>

            <div className="flex flex-col gap-4">
              <Label htmlFor="exercise-search">Search Exercises</Label>
              <input
                id="exercise-search"
                type="text"
                placeholder="Search..."
                className="w-full md:w-64 px-3 py-2 border rounded-md"
                onChange={(e) => {
                  const val = e.target.value.toLowerCase();
                  const filtered = INITIAL_EXERCISES.filter(ex => ex.name.toLowerCase().includes(val));
                  if (filtered.length > 0) setSelectedExercise(filtered[0].name);
                }}
              />
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Select exercise" />
                </SelectTrigger>
                <SelectContent>
                  {INITIAL_EXERCISES.map(ex => (
                    <SelectItem key={ex.id} value={ex.name}>{ex.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-slate-200 shadow-sm lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Latest Strength Summary</CardTitle>
                  {latestStrengthSummary && <CardDescription>{latestStrengthSummary.date}</CardDescription>}
                </CardHeader>
                <CardContent>
                  {latestStrengthSummary ? (
                    <div className="space-y-3">
                      {(latestStrengthSummary.exercises || []).map((ex, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 font-medium truncate mr-2">{ex.name}</span>
                          <span className="text-slate-900 font-bold">{ex.weight} <span className="text-[10px] text-slate-400 font-normal uppercase">lbs</span></span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-center py-4">No data available.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Strength Progress</CardTitle>
                  <CardDescription>Actual logged weight for {selectedExercise}</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] pt-4">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          domain={['dataMin - 10', 'dataMax + 10']}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          cursor={{ stroke: '#800000', strokeWidth: 1 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#800000" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#800000', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          name="Weight (lbs)"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 italic">
                      No data for this exercise yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
      )}
      {view === 'conditioning' && (
        <>
          {/* Conditioning View (Renamed from Running) */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Zap className="text-gold" size={20} />
              <h3 className="text-xl font-bold text-slate-800">Conditioning Overview</h3>
            </div>

            {runningAnalytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Distance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-maroon">{runningAnalytics.totalMiles.toFixed(1)}</span>
                      <span className="text-xs text-slate-400 font-bold uppercase">Miles</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-maroon">{Math.floor(runningAnalytics.totalDurationSeconds / 60)}</span>
                      <span className="text-xs text-slate-400 font-bold uppercase">Min</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-maroon">{runningAnalytics.totalSessions}</span>
                      <span className="text-xs text-slate-400 font-bold uppercase">Runs</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Avg Pace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-maroon">
                        {(() => {
                          if (runningAnalytics.totalMiles === 0 || runningAnalytics.totalDurationSeconds === 0) return '--';
                          const avgPaceSec = runningAnalytics.totalDurationSeconds / runningAnalytics.totalMiles;
                          return secondsToTime(avgPaceSec);
                        })()}
                      </span>
                      <span className="text-xs text-slate-400 font-bold uppercase">/mi</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-slate-200 shadow-sm p-8 text-center text-slate-400 italic">
                No conditioning data logged yet.
              </Card>
            )}
          </section>

          {runningAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Timer size={16} className="text-maroon" />
                    <CardTitle className="text-lg">Pace Trend</CardTitle>
                  </div>
                  <CardDescription>Average pace over time (lower is faster)</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={runningAnalytics.paceHistory.filter(p => p.pace > 0)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        reversed
                        tickFormatter={(val) => secondsToTime(val)}
                      />
                      <Tooltip 
                        formatter={(val: number) => secondsToTime(val)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="pace" 
                        stroke="#800000" 
                        fill="#80000020" 
                        strokeWidth={3}
                        name="Pace"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <PieChartIcon size={16} className="text-gold" />
                    <CardTitle className="text-lg">Conditioning Breakdown</CardTitle>
                  </div>
                  <CardDescription>Distribution of cardio types</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={runningAnalytics.typeData}
                        cx="50%"
                        cy="40%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {runningAnalytics.typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {runningAnalytics.repeatHistory.length > 0 && (
                <Card className="border-slate-200 shadow-sm lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-500" />
                      <CardTitle className="text-lg">Repeats Performance</CardTitle>
                    </div>
                    <CardDescription>Average and best split trends for Repeat sessions</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={runningAnalytics.repeatHistory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          reversed
                          tickFormatter={(val) => secondsToTime(val)}
                        />
                        <Tooltip 
                          formatter={(val: number) => secondsToTime(val)}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="avgSplit" 
                          stroke="#800000" 
                          strokeWidth={3} 
                          name="Avg Split"
                          dot={{ r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="bestSplit" 
                          stroke="#D4AF37" 
                          strokeWidth={2} 
                          name="Best Split"
                          strokeDasharray="5 5"
                          dot={{ r: 4 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <Card className="border-slate-200 shadow-sm lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-600" />
                    <CardTitle className="text-lg">Volume Trends</CardTitle>
                  </div>
                  <CardDescription>Distance and Duration per session</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={runningAnalytics.paceHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis 
                        yAxisId="left"
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="distanceMiles" 
                        fill="#800000" 
                        name="Distance (mi)" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="duration" 
                        fill="#D4AF37" 
                        name="Duration (sec)" 
                        radius={[4, 4, 0, 0]}
                        formatter={(val: number) => Math.floor(val / 60) + ' min'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
      {view === 'battery' && (
        <section className="space-y-8">
          <div className="flex items-center gap-2">
            <Zap className="text-maroon" size={20} />
            <h3 className="text-xl font-bold text-slate-800">Body Battery & Readiness</h3>
          </div>

          {bodyBattery ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Score Card */}
              <Card className="border-slate-200 shadow-sm lg:col-span-1 overflow-hidden">
                <div className="h-2 bg-slate-100 w-full">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      bodyBattery.score > 75 ? "bg-green-500" : bodyBattery.score > 40 ? "bg-gold" : "bg-red-500"
                    )}
                    style={{ width: `${bodyBattery.score}%` }}
                  />
                </div>
                <CardContent className="pt-8 pb-10 flex flex-col items-center text-center">
                  <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-100"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * bodyBattery.score) / 100}
                        strokeLinecap="round"
                        className={cn(
                          "transition-all duration-1000",
                          bodyBattery.score > 75 ? "text-green-500" : bodyBattery.score > 40 ? "text-gold" : "text-red-500"
                        )}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-slate-900">{bodyBattery.score}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Readiness</span>
                    </div>
                  </div>
                  
                  <Badge 
                    className={cn(
                      "px-4 py-1 text-sm font-bold rounded-full mb-4",
                      bodyBattery.status === 'High' ? "bg-green-100 text-green-700 hover:bg-green-100" : 
                      bodyBattery.status === 'Moderate' ? "bg-gold/10 text-gold hover:bg-gold/10" : 
                      "bg-red-100 text-red-700 hover:bg-red-100"
                    )}
                  >
                    {bodyBattery.status} Readiness
                  </Badge>
                  
                  <p className="text-sm text-slate-500 max-w-[200px]">
                    {bodyBattery.status === 'High' ? "You're well recovered and ready for a high-intensity session." : 
                     bodyBattery.status === 'Moderate' ? "Moderate fatigue detected. Consider a standard or technique-focused session." : 
                     "High fatigue detected. A deload or rest day is highly recommended."}
                  </p>
                </CardContent>
              </Card>

              {/* Contributors Grid */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold">Training Load (7d)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-lg font-bold text-maroon">{bodyBattery.liftingLoad}</div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Lifting Load</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gold">{bodyBattery.conditioningLoad}</div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Conditioning Load</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-50">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">Top Fatigue Drivers</div>
                      <div className="flex flex-wrap gap-2">
                        {bodyBattery.topDrivers.length > 0 ? bodyBattery.topDrivers.map(driver => (
                          <Badge key={driver} variant="secondary" className="text-[10px]">{driver}</Badge>
                        )) : <span className="text-xs text-slate-500 italic">None</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold">Intensity & Energy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-2xl font-black text-slate-900">{bodyBattery.avgRPE}</div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Avg RPE (Effort)</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{bodyBattery.avgEnergy}/10</div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Energy Level</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-50">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Recent Strain (48h)</span>
                        <span className={cn("font-bold", bodyBattery.recentImpact === 'High' ? "text-red-500" : "text-green-500")}>
                          {bodyBattery.recentImpact}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full", bodyBattery.recentImpact === 'High' ? "bg-red-500" : "bg-green-500")} 
                          style={{ width: bodyBattery.recentImpact === 'High' ? '85%' : '20%' }} 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm md:col-span-2 bg-slate-900 text-white">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Info size={16} className="text-gold" />
                      How Body Battery Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your Readiness score is a heuristic estimate based on your last 7 days of activity. 
                      It is calculated by balancing training load against recovery indicators. 
                      <span className="text-white font-medium">Higher lifting volume, higher RPE (effort), and frequent conditioning</span> increase fatigue load and reduce your score. 
                      <span className="text-white font-medium">Higher energy scores</span> help offset this fatigue. 
                      Workouts performed in the <span className="text-white font-medium">last 48 hours</span> are weighted more heavily, as recent strain has a greater impact on immediate readiness. 
                      This score is an estimate, not a medical metric.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="border-slate-200 shadow-sm p-12 text-center text-slate-400 italic">
              Log at least one workout to see your readiness estimate.
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
