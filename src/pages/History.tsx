/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Trash2, Calendar, Clock, Printer, Copy, Check, Edit, RotateCcw, AlertTriangle, History as HistoryIcon, GitMerge } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Workout, DeletedWorkout, Block, LiftBlock } from '@/src/types';
import { storage } from '@/src/services/storage';
import { useFirebase } from '@/src/components/FirebaseProvider';
import { normalizeEnergyToFivePoint, flattenLoggedExercises } from '@/src/lib/workoutUtils';

const renderCardioBlockDetails = (block: any) => {
  const subtype = block.subtype || 'Cardio';
  
  if (subtype === 'Repeats') {
    const splits = block.splits || [];
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {block.splitCount !== undefined && (
            <div className="flex justify-between"><span className="text-muted-foreground">Reps:</span><span className="text-foreground font-medium">{block.splitCount}</span></div>
          )}
          {block.restValue !== undefined && block.restValue > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Rest:</span><span className="text-foreground font-medium">{block.restValue} {block.restUnit || 'sec'}</span></div>
          )}
          {block.averageHeartRate !== undefined && block.averageHeartRate > 0 && (
            <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Avg HR:</span><span className="text-foreground font-medium">{block.averageHeartRate}</span></div>
          )}
        </div>
        {splits.length > 0 && splits.some((s: any) => s.timeStr || s.distanceVal) && (
          <div className="pt-2 border-t border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Splits</span>
            <div className="flex flex-wrap gap-1">
              {splits.map((s: any, i: number) => (
                (s.timeStr || s.distanceVal) && (
                  <span key={i} className="bg-card px-1.5 py-0.5 rounded border border-border text-[10px] text-muted-foreground">
                    {s.distanceVal || ''}{s.distanceUnit ? s.distanceUnit : ''} {s.timeStr || ''}
                  </span>
                )
              ))}
            </div>
          </div>
        )}
        {block.programmedNotes && (
          <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/50 whitespace-pre-wrap break-words">{block.programmedNotes}</p>
        )}
      </div>
    );
  }
  
  if (subtype === 'Zone 2') {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {block.programmedDistanceVal !== undefined && block.programmedDistanceVal > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Distance:</span><span className="text-foreground font-medium">{block.programmedDistanceVal} {block.programmedDistanceUnit || 'mi'}</span></div>
          )}
          {block.zone2TimeStr && (
            <div className="flex justify-between"><span className="text-muted-foreground">Time:</span><span className="text-foreground font-medium">{block.zone2TimeStr}</span></div>
          )}
          {block.zone2AverageHeartRate !== undefined && block.zone2AverageHeartRate > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Avg HR:</span><span className="text-foreground font-medium">{block.zone2AverageHeartRate}</span></div>
          )}
        </div>
        {block.programmedNotes && (
          <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/50 whitespace-pre-wrap break-words">{block.programmedNotes}</p>
        )}
      </div>
    );
  }
  
  // Generic cardio fallback (Bike, Ruck, Intervals, Incline Treadmill, Ladders)
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {(block.programmedDistanceVal || block.programmedDistance) && (
          <div className="flex justify-between"><span className="text-muted-foreground">Distance:</span><span className="text-foreground font-medium">{block.programmedDistanceVal || block.programmedDistance} {block.programmedDistanceUnit || ''}</span></div>
        )}
        {(block.programmedDurationVal || block.programmedDuration) && (
          <div className="flex justify-between"><span className="text-muted-foreground">Time:</span><span className="text-foreground font-medium">{block.programmedDurationVal || block.programmedDuration} {block.programmedDurationUnit || ''}</span></div>
        )}
      </div>
      {block.programmedNotes && (
        <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/50 whitespace-pre-wrap break-words">{block.programmedNotes}</p>
      )}
    </div>
  );
};

const renderHiitBlockDetails = (block: any) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {block.programmedReps !== undefined && block.programmedReps > 0 && (
          <div className="flex justify-between"><span className="text-muted-foreground">Rounds:</span><span className="text-foreground font-medium">{block.programmedReps}</span></div>
        )}
        {(block.programmedWorkDistanceVal || block.programmedWorkDistance) && (
          <div className="flex justify-between"><span className="text-muted-foreground">Work Dist:</span><span className="text-foreground font-medium">{block.programmedWorkDistanceVal || block.programmedWorkDistance} {block.programmedWorkDistanceUnit || ''}</span></div>
        )}
        {(block.programmedWorkDurationVal || block.programmedWorkDuration) && (
          <div className="flex justify-between"><span className="text-muted-foreground">Work Time:</span><span className="text-foreground font-medium">{block.programmedWorkDurationVal || block.programmedWorkDuration} {block.programmedWorkDurationUnit || ''}</span></div>
        )}
      </div>
      {block.structureNotes && (
        <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/50 whitespace-pre-wrap break-words">{block.structureNotes}</p>
      )}
      {block.programmedNotes && block.programmedNotes !== block.structureNotes && (
        <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/50 whitespace-pre-wrap break-words">{block.programmedNotes}</p>
      )}
    </div>
  );
};

export default function History({ setCurrentPage }: { setCurrentPage: (page: 'log') => void }) {
  const { user } = useFirebase();
  const [history, setHistory] = useState<Workout[]>([]);
  const [deletedWorkouts, setDeletedWorkouts] = useState<DeletedWorkout[]>([]);
  const [view, setView] = useState<'history' | 'deleted'>('history');
  const [mergeDialog, setMergeDialog] = useState<{ open: boolean; sessions: Workout[]; }>({ open: false, sessions: [] });
  const [parentSessionId, setParentSessionId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');  // YYYY-MM-DD

  useEffect(() => {
    if (mergeDialog.open && mergeDialog.sessions.length > 0) {
      setParentSessionId(mergeDialog.sessions[0].id);
    }
  }, [mergeDialog.open, mergeDialog.sessions]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = storage.subscribeToWorkouts(user.uid, (data) => {
      setHistory(data);
    });
    
    // Fetch deleted workouts
    const fetchDeleted = async () => {
      const deleted = await storage.getDeletedWorkouts(user.uid);
      setDeletedWorkouts(deleted as DeletedWorkout[]);
    };
    fetchDeleted();
    
    return () => unsubscribe();
  }, [user]);

  const removeWorkout = async (id: string) => {
    if (!user) return;
    await storage.deleteWorkout(id, user.uid);
    // Refresh deleted workouts list
    const deleted = await storage.getDeletedWorkouts(user.uid);
    setDeletedWorkouts(deleted as DeletedWorkout[]);
  };

  const restoreWorkout = async (workout: DeletedWorkout) => {
    if (!user) return;
    await storage.restoreWorkout(workout, user.uid);
    // Refresh deleted workouts list
    const deleted = await storage.getDeletedWorkouts(user.uid);
    setDeletedWorkouts(deleted as DeletedWorkout[]);
  };

  const openMergeDialog = (workout: Workout) => {
    const dateKey = format(new Date(workout.date), 'yyyy-MM-dd');
    const sessions = history
      .filter(w => {
        try { return format(new Date(w.date), 'yyyy-MM-dd') === dateKey; }
        catch { return false; }
      })
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    setMergeDialog({ open: true, sessions });
  };

  const performMerge = async () => {
    if (!user || !parentSessionId) return;
    const parent = mergeDialog.sessions.find(s => s.id === parentSessionId);
    if (!parent) return;
    const others = mergeDialog.sessions.filter(s => s.id !== parentSessionId);
    
    // Merge strategy: append other sessions' lift-block exercises into parent's
    // first lift block (create one if missing). Append other sessions' non-lift
    // blocks (cardio/hiit) after parent's blocks.
    const parentBlocks: Block[] = JSON.parse(JSON.stringify(parent.blocks || []));
    let parentLiftBlock = parentBlocks.find(b => b.kind === 'lift') as LiftBlock | undefined;
    if (!parentLiftBlock) {
      parentLiftBlock = {
        id: `lift_${Math.random().toString(36).substr(2, 9)}`,
        kind: 'lift',
        exercises: [],
      };
      parentBlocks.unshift(parentLiftBlock);
    }
    
    others.forEach(other => {
      (other.blocks || []).forEach(b => {
        if (b.kind === 'lift') {
          parentLiftBlock!.exercises.push(...(b as LiftBlock).exercises);
        } else {
          // cardio or hiit — append as new block
          parentBlocks.push(JSON.parse(JSON.stringify(b)));
        }
      });
      // If other has legacy exercises (no blocks), append them too
      if ((!other.blocks || other.blocks.length === 0) && other.exercises?.length) {
        parentLiftBlock!.exercises.push(...other.exercises);
      }
    });
    
    // Regenerate ids to avoid collisions
    parentBlocks.forEach(b => {
      if (b.kind === 'lift') {
        (b as LiftBlock).exercises.forEach(ex => {
          ex.id = Math.random().toString(36).substr(2, 9);
          if (ex.superset) ex.superset.id = Math.random().toString(36).substr(2, 9);
        });
      }
    });
    
    const mergedWorkout: Workout = {
      ...parent,
      blocks: parentBlocks,
      // Also update legacy exercises field to stay in sync
      exercises: parentBlocks
        .filter(b => b.kind === 'lift')
        .flatMap(b => (b as LiftBlock).exercises),
    };
    
    try {
      await storage.saveWorkout(mergedWorkout, user.uid);
      for (const other of others) {
        await storage.deleteWorkout(other.id, user.uid);
      }
      setMergeDialog({ open: false, sessions: [] });
      setParentSessionId(null);
    } catch (error) {
      console.error('Merge failed:', error);
      alert('Merge failed. Check console for details.');
    }
  };

  const permanentlyDeleteWorkout = async (id: string) => {
    if (!user) return;
    await storage.permanentlyDeleteWorkout(id, user.uid);
    // Refresh deleted workouts list
    const deleted = await storage.getDeletedWorkouts(user.uid);
    setDeletedWorkouts(deleted as DeletedWorkout[]);
  };

  const editWorkout = async (workout: Workout) => {
    if (!user) return;
    await storage.saveDraft({ ...workout, isHistorical: true }, user.uid);
    setCurrentPage('log');
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyWorkoutToClipboard = (workout: Workout) => {
    const dateStr = format(new Date(workout.date), 'EEEE, MMMM do, yyyy');
    let text = `WORKOUT LOG: ${workout.workoutName}\n`;
    text += `Date: ${dateStr}\n`;
    text += `-----------------------------------\n\n`;
    
    text += `CONDITIONING:\n`;
    if (workout.blocks && workout.blocks.some((b: any) => b.kind === 'cardio' || b.kind === 'hiit')) {
      workout.blocks.filter((b: any) => b.kind === 'cardio' || b.kind === 'hiit').forEach((block: any) => {
        text += `- ${block.kind === 'hiit' ? (block.hiitType || block.subtype || 'HIIT') : (block.subtype || 'Cardio').toUpperCase()}: ${block.programmedName || block.subtype || ''}\n`;
        if (block.programmedNotes) text += `  Notes: ${block.programmedNotes}\n`;
      });
      text += `\n`;
    } else if (workout.conditioning && workout.conditioning.type) {
      text += `- ${workout.conditioning.type}: ${workout.conditioning.name || 'Unnamed'}\n`;
      if (workout.conditioning.notes) text += `  Notes: ${workout.conditioning.notes}\n`;
      text += `\n`;
    } else {
      text += `None recorded\n\n`;
    }

    text += `EXERCISES:\n`;
    if (workout.exercises) {
      flattenLoggedExercises(workout.exercises).forEach((ex, i) => {
        text += `${i + 1}. ${ex.name}\n`;
        
        if (ex.trackingMode === 'distance') {
          text += `   ${ex.sets} sets x ${ex.distance || ex.distanceVal}${ex.distanceUnit} @ ${ex.weight} lbs\n`;
        } else if (ex.trackingMode === 'time') {
          text += `   ${ex.sets} sets x ${ex.time || ex.timeVal} @ ${ex.weight} lbs\n`;
        } else if (ex.usePerSetWeights && ex.perSetWeights) {
          text += `   Sets: ${ex.sets} | Reps: ${ex.reps}\n`;
          text += `   Weights: ${ex.perSetWeights.join(', ')} lbs\n`;
        } else {
          text += `   ${ex.sets} sets x ${ex.reps} reps @ ${ex.weight} lbs\n`;
        }
        
        if (ex.rpe) text += `   RPE: ${ex.rpe}\n`;
        if (ex.rir !== null) text += `   RIR: ${ex.rir}\n`;
        if (ex.notes) text += `   Notes: ${ex.notes}\n`;
        
        text += `\n`;
      });
    }

    text += `POST-WORKOUT:\n`;
    text += `   Energy Level: ${normalizeEnergyToFivePoint(workout.postWorkoutEnergy)}/5\n`;
    if (workout.notes) text += `   General Notes: ${workout.notes}\n`;

    navigator.clipboard.writeText(text);
    setCopiedId(workout.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const printWorkout = (workout: Workout) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = format(new Date(workout.date), 'EEEE, MMMM do, yyyy');
    
    const html = `
      <html>
        <head>
          <title>Workout Log - ${workout.workoutName}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #334155; line-height: 1.5; }
            h1 { color: #800000; margin-bottom: 5px; }
            .date { color: #64748b; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 12px; color: #94a3b8; margin-bottom: 10px; letter-spacing: 0.05em; }
            .exercise { margin-bottom: 15px; padding-left: 15px; border-left: 3px solid #f1f5f9; }
            .exercise-name { font-weight: bold; font-size: 16px; margin-bottom: 4px; }
            .exercise-details { font-size: 14px; color: #475569; }
            .notes { font-style: italic; font-size: 13px; color: #64748b; margin-top: 5px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
          </style>
        </head>
        <body>
          <h1>${workout.workoutName}</h1>
          <div class="date">${dateStr}</div>
          
          <div class="grid">
            <div class="section">
              <div class="section-title">Conditioning</div>
              ${workout.blocks && workout.blocks.some((b: any) => b.kind === 'cardio' || b.kind === 'hiit') ? `
                <div style="font-size: 14px; color: #475569;">
                  ${workout.blocks.filter((b: any) => b.kind === 'cardio' || b.kind === 'hiit').map((block: any) => `
                    <strong>${block.kind === 'hiit' ? (block.hiitType || block.subtype || 'HIIT') : (block.subtype || 'Cardio').toUpperCase()}: ${block.programmedName || block.subtype || ''}</strong><br/>
                    ${block.programmedNotes ? `<div class="notes">${block.programmedNotes}</div>` : ''}
                  `).join('<br/>')}
                </div>
              ` : workout.conditioning && workout.conditioning.type ? `
                <div style="font-size: 14px; color: #475569;">
                  <strong>${workout.conditioning.type}: ${workout.conditioning.name || 'Unnamed'}</strong><br/>
                  ${workout.conditioning.workDistance || workout.conditioning.workDuration ? `Work: ${workout.conditioning.workDistance || workout.conditioning.workDuration} ${workout.conditioning.workUnits || ''}<br/>` : ''}
                  ${workout.conditioning.reps ? `Reps: ${workout.conditioning.reps}<br/>` : ''}
                  ${workout.conditioning.restValue ? `Rest: ${workout.conditioning.restValue}<br/>` : ''}
                  ${workout.conditioning.targetSplit ? `Target: ${workout.conditioning.targetSplit}<br/>` : ''}
                  ${workout.conditioning.averagePace ? `Avg Pace: ${workout.conditioning.averagePace}<br/>` : ''}
                  ${workout.conditioning.actualSplits && workout.conditioning.actualSplits.some((s: any) => s) ? `Splits: ${workout.conditioning.actualSplits.filter((s: any) => s).join(', ')}<br/>` : ''}
                  ${workout.conditioning.notes ? `<div class="notes">${workout.conditioning.notes}</div>` : ''}
                </div>
              ` : `<p>None recorded</p>`}
            </div>
            <div class="section">
              <div class="section-title">Post-Workout</div>
              <p>Energy: ${normalizeEnergyToFivePoint(workout.postWorkoutEnergy)}/5</p>
              <p>${workout.notes || ''}</p>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Exercises</div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Group same-date sessions so we can show "Session X of Y" badges
  const sessionIndexMap = useMemo(() => {
    const byDate = new Map<string, Workout[]>();
    history.forEach(w => {
      try {
        const key = format(new Date(w.date), 'yyyy-MM-dd');
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key)!.push(w);
      } catch { /* skip */ }
    });
    // Sort each day's sessions by timestamp (earliest first)
    byDate.forEach(arr => arr.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
    // Map workout.id -> { index, total }
    const map = new Map<string, { index: number; total: number }>();
    byDate.forEach(arr => {
      arr.forEach((w, idx) => {
        map.set(w.id, { index: idx + 1, total: arr.length });
      });
    });
    return map;
  }, [history]);

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return history.filter(w => {
      // Date range
      if (filterDate && format(new Date(w.date), 'yyyy-MM-dd') !== filterDate) return false;
      // Text query — match name OR notes OR any exercise name
      if (q) {
        const inName = (w.workoutName || '').toLowerCase().includes(q);
        const inNotes = (w.notes || '').toLowerCase().includes(q);
        const exList = (w.blocks || [])
          .filter((b: any) => b.kind === 'lift')
          .flatMap((b: any) => b.exercises || [])
          .concat(w.exercises || []);
        const inEx = exList.some((e: any) =>
          (e.name || '').toLowerCase().includes(q) ||
          (e.superset?.name || '').toLowerCase().includes(q)
        );
        if (!inName && !inNotes && !inEx) return false;
      }
      return true;
    });
  }, [history, searchQuery, filterDate]);

  return (
    <div className="page-shell">
      <header className="page-header items-start">
        <div>
          <h2 className="page-title">Workout History</h2>
          <p className="page-subtitle">Review and manage your past training sessions</p>
        </div>
      </header>

      <div className="flex bg-card p-1 rounded-xl border border-border w-fit overflow-x-auto max-w-full shadow-sm mb-4">
        <button
          onClick={() => setView('history')}
          className={cn(
            "px-4 py-2 text-xs font-bold transition-all rounded-lg whitespace-nowrap",
            view === 'history'
              ? "bg-maroon text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          History
        </button>

        <button
          onClick={() => setView('deleted')}
          className={cn(
            "px-4 py-2 text-xs font-bold transition-all rounded-lg whitespace-nowrap",
            view === 'deleted'
              ? "bg-maroon text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Recently Deleted
        </button>
      </div>

      {view === 'history' && (
        <div className="space-y-4">
          <div className="card-shell p-4 mb-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 space-y-1">
                <Label className="label-micro">Search</Label>
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by workout name, exercise name, or notes..."
                  className="input-standard h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="label-micro">Date</Label>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="input-standard h-9 text-sm"
                />
              </div>
              {(searchQuery || filterDate) && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterDate('');
                    }}
                    className="h-9 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Showing {filteredHistory.length} of {history.length} {history.length === 1 ? 'workout' : 'workouts'}
            </div>
          </div>

          {filteredHistory.length === 0 && history.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No workouts match your filters.
            </div>
          )}

          {history.length > 0 ? (
            filteredHistory.sort((a, b) => {
              const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
              if (dateDiff !== 0) return dateDiff;
              return (a.timestamp || 0) - (b.timestamp || 0); // Within same date, earliest first (matches session numbering)
            }).map(workout => (
              <Card key={workout.id} className="card-shell hover:border-maroon/30 transition-colors group">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-maroon/5 rounded-lg flex flex-col items-center justify-center text-maroon">
                        <span className="text-xs font-bold uppercase">{format(new Date(workout.date), 'MMM')}</span>
                        <span className="text-lg font-bold leading-none">{format(new Date(workout.date), 'dd')}</span>
                      </div>
                      <div>
                        <CardTitle className="text-xl">{workout.workoutName}</CardTitle>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(workout.date), 'EEEE')}</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> {format(new Date(workout.date), 'p')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => editWorkout(workout)}
                        title="Edit workout"
                        className="text-muted-foreground hover:text-maroon"
                      >
                        <Edit size={18} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyWorkoutToClipboard(workout)}
                        title="Copy to clipboard"
                        className="text-muted-foreground hover:text-maroon"
                      >
                        {copiedId === workout.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => printWorkout(workout)}
                        title="Print workout"
                        className="text-muted-foreground hover:text-maroon"
                      >
                        <Printer size={18} />
                      </Button>
                      {sessionIndexMap.get(workout.id)?.total && sessionIndexMap.get(workout.id)!.total > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openMergeDialog(workout)}
                          title="Merge sessions from this day"
                          className="text-muted-foreground hover:text-maroon"
                        >
                          <GitMerge size={18} />
                        </Button>
                      )}
                      {(() => {
                        const info = sessionIndexMap.get(workout.id);
                        if (info && info.total > 1) {
                          return (
                            <span className="text-[10px] font-bold text-maroon bg-maroon/10 border border-maroon/20 px-1.5 py-0.5 rounded uppercase tracking-wider mr-1">
                              Session {info.index} of {info.total}
                            </span>
                          );
                        }
                        return null;
                      })()}
                      <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20">
                        Energy: {normalizeEnergyToFivePoint(workout.postWorkoutEnergy)}/5
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeWorkout(workout.id)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exercises</h4>
                      <div className="space-y-2">
                        {(workout.exercises || []).map(ex => (
                          <div key={ex.id} className="space-y-1 border-b border-border pb-2 last:border-0">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-foreground">{ex.name}</span>
                              <span className="text-muted-foreground">
                                {ex.trackingMode === 'distance' 
                                  ? `${ex.sets} sets x ${ex.distance}${ex.distanceUnit} @ ${ex.weight} lbs`
                                  : ex.usePerSetWeights && ex.perSetWeights 
                                    ? `${ex.sets}x${ex.reps} (${ex.perSetWeights.join(', ')}) lbs` 
                                    : `${ex.sets}x${ex.reps} @ ${ex.weight} lbs`
                                }
                              </span>
                            </div>
                            {ex.notes && (
                              <p className="text-[11px] text-muted-foreground italic">{ex.notes}</p>
                            )}
                            {ex.superset && (
                              <div className="flex items-center justify-between text-[11px] pl-3 border-l-2 border-maroon/20 text-maroon/70">
                                <span className="font-medium">+ {ex.superset.name}</span>
                                <span>
                                  {ex.superset.trackingMode === 'distance'
                                    ? `${ex.superset.sets} sets x ${ex.superset.distance}${ex.superset.distanceUnit} @ ${ex.superset.weight} lbs`
                                    : `${ex.superset.sets}x${ex.superset.reps} @ ${ex.superset.weight} lbs`
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Details</h4>
                      
                      {/* Block-based rendering (post-2.6 workouts) */}
                      {workout.blocks && workout.blocks.length > 0 && workout.blocks.some((b: any) => b.kind === 'cardio' || b.kind === 'hiit') ? (
                        <>
                          {workout.blocks
                            .filter((b: any) => b.kind === 'cardio' || b.kind === 'hiit')
                            .map((block: any, idx: number) => (
                              <div key={block.id || idx} className="bg-muted/50 p-3 rounded-lg border border-border space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline" className="bg-maroon/5 text-maroon border-maroon/10 text-[10px] uppercase font-bold">
                                    {block.kind === 'hiit' 
                                      ? (block.hiitType || block.subtype || 'HIIT') 
                                      : (block.subtype || 'Cardio').toUpperCase()}
                                  </Badge>
                                  {(block.programmedName || (block.kind === 'cardio' && block.subtype)) && (
                                    <span className="text-xs text-muted-foreground">{block.programmedName || block.subtype}</span>
                                  )}
                                </div>
                                {block.kind === 'cardio' ? renderCardioBlockDetails(block) : renderHiitBlockDetails(block)}
                              </div>
                            ))}
                        </>
                      ) : (
                        /* Legacy conditioning rendering (pre-2.6 workouts that never had blocks) */
                        workout.conditioning && workout.conditioning.type ? (
                          <div className="bg-muted/50 p-3 rounded-lg border border-border space-y-2">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="bg-maroon/5 text-maroon border-maroon/10 text-[10px] uppercase font-bold">
                                {workout.conditioning.type.toUpperCase()}
                              </Badge>
                              {workout.conditioning.name && (
                                <span className="text-xs text-muted-foreground">{workout.conditioning.name}</span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              {(workout.conditioning.workDistance || workout.conditioning.workDuration) && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Work:</span>
                                  <span className="text-foreground font-medium">{workout.conditioning.workDistance || workout.conditioning.workDuration} {workout.conditioning.workUnits || ''}</span>
                                </div>
                              )}
                              {workout.conditioning.reps && (
                                <div className="flex justify-between"><span className="text-muted-foreground">Reps:</span><span className="text-foreground font-medium">{workout.conditioning.reps}</span></div>
                              )}
                              {workout.conditioning.restType !== 'none' && workout.conditioning.restValue && (
                                <div className="flex justify-between"><span className="text-muted-foreground">Rest:</span><span className="text-foreground font-medium">{workout.conditioning.restValue}</span></div>
                              )}
                              {workout.conditioning.targetSplit && (
                                <div className="flex justify-between"><span className="text-muted-foreground">Target:</span><span className="text-foreground font-medium">{workout.conditioning.targetSplit}</span></div>
                              )}
                            </div>
                            {workout.conditioning.actualSplits && workout.conditioning.actualSplits.some((s: any) => s) && (
                              <div className="pt-2 border-t border-border/50">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Splits</span>
                                <div className="flex flex-wrap gap-1">
                                  {workout.conditioning.actualSplits.map((split: any, i: number) => split && (
                                    <span key={i} className="bg-card px-1.5 py-0.5 rounded border border-border text-[10px] text-muted-foreground">{split}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {workout.conditioning.notes && (
                              <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/50 whitespace-pre-wrap break-words">{workout.conditioning.notes}</p>
                            )}
                          </div>
                        ) : null
                      )}
                      
                      {/* General Notes Box — user-typed notes only */}
                      {workout.notes && workout.notes.trim() !== '' && (
                        <div className="bg-muted/50 p-3 rounded-lg border border-border space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="bg-maroon/5 text-maroon border-maroon/10 text-[10px] uppercase font-bold">
                              NOTES
                            </Badge>
                          </div>
                          <p className="text-[12px] text-foreground font-medium leading-relaxed whitespace-pre-wrap break-words">{workout.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="card-shell py-20 text-center">
              <CardContent>
                <HistoryIcon size={48} className="mx-auto text-muted mb-4" />
                <h3 className="text-xl font-semibold text-foreground">No History Yet</h3>
                <p className="text-muted-foreground">Your logged workouts will appear here.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {view === 'deleted' && (
        <div className="space-y-4">
          {deletedWorkouts.length > 0 ? (
            deletedWorkouts.map(workout => (
              <Card key={workout.id} className="card-shell bg-muted/50">
                <CardHeader className="py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base text-foreground line-through opacity-70">{workout.workoutName}</CardTitle>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(workout.date), 'MMM do, yyyy')}</span>
                        <span className="flex items-center gap-1 text-red-500/70">
                          <AlertTriangle size={12} /> Deleted {format(new Date(workout.deletedAt), 'MMM do')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => restoreWorkout(workout)}
                        className="text-muted-foreground hover:text-green-600 border-border"
                      >
                        <RotateCcw size={14} className="mr-1.5" /> Restore
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => permanentlyDeleteWorkout(workout.id)}
                        className="text-muted-foreground hover:text-red-600"
                        title="Permanently Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card className="card-shell py-20 text-center">
              <CardContent>
                <Trash2 size={48} className="mx-auto text-muted mb-4" />
                <h3 className="text-xl font-semibold text-foreground">No recently deleted workouts.</h3>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      <Dialog open={mergeDialog.open} onOpenChange={(open) => setMergeDialog(m => ({ ...m, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Sessions</DialogTitle>
            <DialogDescription>
              Pick which session becomes the parent. Its name, notes, energy, and summary
              are kept. The other session's exercises and conditioning are appended into
              the parent, and the other session is deleted. This cannot be undone from
              here — but deleted sessions remain in the trash for recovery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {mergeDialog.sessions.map((s, idx) => (
              <label key={s.id} className={cn(
                "flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors",
                parentSessionId === s.id
                  ? "border-maroon bg-maroon/5"
                  : "border-border hover:border-maroon/40"
              )}>
                <input
                  type="radio"
                  name="merge-parent"
                  checked={parentSessionId === s.id}
                  onChange={() => setParentSessionId(s.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-maroon bg-maroon/10 px-1.5 py-0.5 rounded uppercase">
                      Session {idx + 1}
                    </span>
                    <span className="font-semibold">{s.workoutName || 'Untitled'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(s.date), 'p')} — {
                      (s.blocks?.flatMap(b => b.kind === 'lift' ? (b as any).exercises : []) || []).length
                    } exercises
                  </div>
                  {parentSessionId === s.id && (
                    <div className="text-[11px] font-bold text-maroon mt-2">
                      ✓ Parent — this session's name and metadata will be kept
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialog(m => ({ ...m, open: false }))}>
              Cancel
            </Button>
            <Button
              onClick={performMerge}
              disabled={!parentSessionId}
              className="btn-primary"
            >
              Merge Sessions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
