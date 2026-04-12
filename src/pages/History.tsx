/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Trash2, Calendar, Clock, Printer, Copy, Check, Edit, RotateCcw, AlertTriangle, History as HistoryIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Workout, DeletedWorkout } from '@/src/types';
import { storage } from '@/src/services/storage';
import { useFirebase } from '@/src/components/FirebaseProvider';

export default function History({ setCurrentPage }: { setCurrentPage: (page: 'log') => void }) {
  const { user } = useFirebase();
  const [history, setHistory] = useState<Workout[]>([]);
  const [deletedWorkouts, setDeletedWorkouts] = useState<DeletedWorkout[]>([]);
  const [view, setView] = useState<'history' | 'deleted'>('history');

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
    
    if (workout.runningStats) {
      text += `CONDITIONING:\n${workout.runningStats}\n\n`;
    }

    text += `EXERCISES:\n`;
    if (workout.exercises) {
      workout.exercises.forEach((ex, i) => {
        text += `${i + 1}. ${ex.name}\n`;
        if (ex.usePerSetWeights && ex.perSetWeights) {
          text += `   Sets: ${ex.sets} | Reps: ${ex.reps}\n`;
          text += `   Weights: ${ex.perSetWeights.join(', ')} lbs\n`;
        } else {
          text += `   ${ex.sets} sets x ${ex.reps} reps @ ${ex.weight} lbs\n`;
        }
        if (ex.rpe) text += `   RPE: ${ex.rpe}\n`;
        if (ex.rir !== null) text += `   RIR: ${ex.rir}\n`;
        if (ex.notes) text += `   Notes: ${ex.notes}\n`;
        
        if (ex.superset) {
          text += `   + SUPERSET: ${ex.superset.name}\n`;
          text += `     ${ex.superset.sets} sets x ${ex.superset.reps} reps @ ${ex.superset.weight} lbs\n`;
          if (ex.superset.rpe) text += `     RPE: ${ex.superset.rpe}\n`;
          if (ex.superset.rir !== null) text += `     RIR: ${ex.superset.rir}\n`;
          if (ex.superset.notes) text += `     Notes: ${ex.superset.notes}\n`;
        }
        
        text += `\n`;
      });
    }

    text += `POST-WORKOUT:\n`;
    text += `   Energy Level: ${workout.postWorkoutEnergy}/10\n`;
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
              ${workout.conditioning && workout.conditioning.type ? `
                <div style="font-size: 14px; color: #475569;">
                  <strong>${workout.conditioning.type}: ${workout.conditioning.name || 'Unnamed'}</strong><br/>
                  ${workout.conditioning.workDistance || workout.conditioning.workDuration ? `Work: ${workout.conditioning.workDistance || workout.conditioning.workDuration} ${workout.conditioning.workUnits || ''}<br/>` : ''}
                  ${workout.conditioning.reps ? `Reps: ${workout.conditioning.reps}<br/>` : ''}
                  ${workout.conditioning.restValue ? `Rest: ${workout.conditioning.restValue}<br/>` : ''}
                  ${workout.conditioning.targetSplit ? `Target: ${workout.conditioning.targetSplit}<br/>` : ''}
                  ${workout.conditioning.averagePace ? `Avg Pace: ${workout.conditioning.averagePace}<br/>` : ''}
                  ${workout.conditioning.actualSplits && workout.conditioning.actualSplits.some(s => s) ? `Splits: ${workout.conditioning.actualSplits.filter(s => s).join(', ')}<br/>` : ''}
                  ${workout.conditioning.notes ? `<div class="notes">${workout.conditioning.notes}</div>` : ''}
                </div>
              ` : `<p>${workout.runningStats || 'None recorded'}</p>`}
            </div>
            <div class="section">
              <div class="section-title">Post-Workout</div>
              <p>Energy: ${workout.postWorkoutEnergy}/10</p>
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

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Workout History</h2>
        <p className="text-slate-500">Review and manage your past training sessions</p>
      </header>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('history')}
          className={cn(
            "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
            view === 'history'
              ? "bg-card text-maroon shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          History
        </button>

        <button
          onClick={() => setView('deleted')}
          className={cn(
            "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
            view === 'deleted'
              ? "bg-card text-maroon shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Recently Deleted
        </button>
      </div>

      {view === 'history' && (
        <div className="space-y-4">
          {history.length > 0 ? (
            history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(workout => (
              <Card key={workout.id} className="border-slate-200 shadow-sm hover:border-maroon/30 transition-colors group">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-maroon/5 rounded-lg flex flex-col items-center justify-center text-maroon">
                        <span className="text-xs font-bold uppercase">{format(new Date(workout.date), 'MMM')}</span>
                        <span className="text-lg font-bold leading-none">{format(new Date(workout.date), 'dd')}</span>
                      </div>
                      <div>
                        <CardTitle className="text-xl">{workout.workoutName}</CardTitle>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
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
                        className="text-slate-400 hover:text-maroon"
                      >
                        <Edit size={18} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyWorkoutToClipboard(workout)}
                        title="Copy to clipboard"
                        className="text-slate-400 hover:text-maroon"
                      >
                        {copiedId === workout.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => printWorkout(workout)}
                        title="Print workout"
                        className="text-slate-400 hover:text-maroon"
                      >
                        <Printer size={18} />
                      </Button>
                      <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20">
                        Energy: {workout.postWorkoutEnergy}/10
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeWorkout(workout.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Exercises</h4>
                      <div className="space-y-2">
                        {(workout.exercises || []).map(ex => (
                          <div key={ex.id} className="space-y-1 border-b border-slate-50 pb-2 last:border-0">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-700">{ex.name}</span>
                              <span className="text-slate-500">
                                {ex.trackingMode === 'distance' 
                                  ? `${ex.sets} sets x ${ex.distance}${ex.distanceUnit} @ ${ex.weight} lbs`
                                  : ex.usePerSetWeights && ex.perSetWeights 
                                    ? `${ex.sets}x${ex.reps} (${ex.perSetWeights.join(', ')}) lbs` 
                                    : `${ex.sets}x${ex.reps} @ ${ex.weight} lbs`
                                }
                              </span>
                            </div>
                            {ex.notes && (
                              <p className="text-[11px] text-slate-400 italic">{ex.notes}</p>
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
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Conditioning & Notes</h4>
                      <div className="space-y-2">
                        {workout.conditioning && workout.conditioning.type ? (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="bg-maroon/5 text-maroon border-maroon/10 text-[10px] uppercase font-bold">
                                {workout.conditioning.type}
                              </Badge>
                              <span className="text-xs font-bold text-slate-700">{workout.conditioning.name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                              {(workout.conditioning.workDistance || workout.conditioning.workDuration) && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Work:</span>
                                  <span className="text-slate-700 font-medium">{workout.conditioning.workDistance || workout.conditioning.workDuration} {workout.conditioning.workUnits}</span>
                                </div>
                              )}
                              {workout.conditioning.reps && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Reps:</span>
                                  <span className="text-slate-700 font-medium">{workout.conditioning.reps}</span>
                                </div>
                              )}
                              {workout.conditioning.restType !== 'none' && workout.conditioning.restValue && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Rest:</span>
                                  <span className="text-slate-700 font-medium">{workout.conditioning.restValue}</span>
                                </div>
                              )}
                              {workout.conditioning.targetSplit && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Target:</span>
                                  <span className="text-slate-700 font-medium">{workout.conditioning.targetSplit}</span>
                                </div>
                              )}
                            </div>
                            {workout.conditioning.actualSplits && workout.conditioning.actualSplits.some(s => s) && (
                              <div className="pt-2 border-t border-slate-200/50">
                                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Splits</span>
                                <div className="flex flex-wrap gap-1">
                                  {workout.conditioning.actualSplits.map((split, i) => split && (
                                    <span key={i} className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] text-slate-600">
                                      {split}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {workout.conditioning.notes && (
                              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/50">{workout.conditioning.notes}</p>
                            )}
                          </div>
                        ) : null}
                        
                        {!workout.conditioning?.type && (
                          <p className="text-sm text-slate-600 italic">"{workout.runningStats}"</p>
                        )}
                        
                        {workout.notes && (
                          <p className="text-sm text-slate-500 line-clamp-2">{workout.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-slate-200 shadow-sm py-20 text-center">
              <CardContent>
                <HistoryIcon size={48} className="mx-auto text-slate-200 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900">No History Yet</h3>
                <p className="text-slate-500">Your logged workouts will appear here.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {view === 'deleted' && (
        <div className="space-y-4">
          {deletedWorkouts.length > 0 ? (
            deletedWorkouts.map(workout => (
              <Card key={workout.id} className="border-slate-200 shadow-sm bg-slate-50/50">
                <CardHeader className="py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base text-slate-700 line-through opacity-70">{workout.workoutName}</CardTitle>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
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
                        className="text-slate-600 hover:text-green-600 border-slate-200"
                      >
                        <RotateCcw size={14} className="mr-1.5" /> Restore
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => permanentlyDeleteWorkout(workout.id)}
                        className="text-slate-400 hover:text-red-600"
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
            <Card className="border-slate-200 shadow-sm py-20 text-center">
              <CardContent>
                <Trash2 size={48} className="mx-auto text-slate-200 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900">No recently deleted workouts.</h3>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
