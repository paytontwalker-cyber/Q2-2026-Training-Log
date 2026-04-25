/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Download, Printer, FileText, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { storage } from '@/src/services/storage';
import { useFirebase } from '@/src/components/FirebaseProvider';
import { Workout } from '@/src/types';
import { format } from 'date-fns';

export default function Export({ embedded = false }: { embedded?: boolean } = {}) {
  const { user } = useFirebase();
  const [history, setHistory] = useState<Workout[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = storage.subscribeToWorkouts(user.uid, (data) => {
      setHistory(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleExportCSV = () => {
    if (history.length === 0) return;
    setIsExporting(true);
    
    setTimeout(() => {
      const headers = [
        "Date",
        "Day of Week",
        "Workout Name",
        "Type",
        "Exercise / Block Name",
        "Subtype",
        "Muscle Group",
        "Sets",
        "Reps",
        "Weight (lbs)",
        "Distance",
        "Duration",
        "RPE",
        "RIR",
        "Entry Notes",
        "Post-Workout Energy",
        "Workout Notes"
      ];

      const escapeCSV = (v: any): string => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        if (s.includes('"') || s.includes(',') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };

      const rows = history.flatMap(workout => {
        const date = new Date(workout.date);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dow = format(date, 'EEEE');
        const workoutRows: (string | number)[][] = [];

        // Prefer blocks if present (post-2.6 workouts), otherwise fall back to legacy exercises + conditioning
        const blocks = (workout as any).blocks as any[] | undefined;

        if (blocks && blocks.length > 0) {
          for (const block of blocks) {
            if (block.kind === 'lift' && block.exercises) {
              for (const ex of block.exercises) {
                workoutRows.push([
                  escapeCSV(dateStr),
                  escapeCSV(dow),
                  escapeCSV(workout.workoutName),
                  'Lift',
                  escapeCSV(ex.name),
                  '',
                  escapeCSV(ex.muscleGroup),
                  escapeCSV(ex.sets),
                  escapeCSV(ex.reps),
                  escapeCSV(ex.usePerSetWeights && ex.perSetWeights ? ex.perSetWeights.join(' / ') : ex.weight),
                  '', '',
                  escapeCSV(ex.rpe ?? ''),
                  escapeCSV(ex.rir ?? ''),
                  escapeCSV(ex.notes || ''),
                  escapeCSV(workout.postWorkoutEnergy),
                  escapeCSV(workout.notes || ''),
                ]);
              }
            } else if (block.kind === 'cardio') {
              workoutRows.push([
                escapeCSV(dateStr),
                escapeCSV(dow),
                escapeCSV(workout.workoutName),
                'Cardio',
                escapeCSV(block.programmedName || ''),
                escapeCSV(block.subtype || ''),
                '', '', '', '',
                escapeCSV(block.loggedDistance || block.programmedDistance || ''),
                escapeCSV(block.loggedDuration || block.programmedDuration || ''),
                '', '',
                escapeCSV(block.loggedNotes || block.programmedNotes || ''),
                escapeCSV(workout.postWorkoutEnergy),
                escapeCSV(workout.notes || ''),
              ]);
            } else if (block.kind === 'hiit') {
              workoutRows.push([
                escapeCSV(dateStr),
                escapeCSV(dow),
                escapeCSV(workout.workoutName),
                'HIIT',
                escapeCSV(block.programmedName || ''),
                escapeCSV(block.subtype || ''),
                '',
                '',
                escapeCSV(block.programmedReps ?? ''),
                '',
                escapeCSV(block.programmedWorkDistance || ''),
                escapeCSV(block.programmedWorkDuration || ''),
                '', '',
                escapeCSV(block.loggedNotes || ''),
                escapeCSV(workout.postWorkoutEnergy),
                escapeCSV(workout.notes || ''),
              ]);
            }
          }
        } else {
          // Legacy fallback for pre-2.6 workouts
          for (const ex of (workout.exercises || [])) {
            workoutRows.push([
              escapeCSV(dateStr),
              escapeCSV(dow),
              escapeCSV(workout.workoutName),
              'Lift',
              escapeCSV(ex.name),
              '',
              escapeCSV(ex.muscleGroup),
              escapeCSV(ex.sets),
              escapeCSV(ex.reps),
              escapeCSV(ex.usePerSetWeights && ex.perSetWeights ? ex.perSetWeights.join(' / ') : ex.weight),
              '', '',
              escapeCSV(ex.rpe ?? ''),
              escapeCSV(ex.rir ?? ''),
              escapeCSV(ex.notes || ''),
              escapeCSV(workout.postWorkoutEnergy),
              escapeCSV(workout.notes || ''),
            ]);
          }
          // Also emit a conditioning row if legacy conditioning field has content
          const cond = (workout as any).conditioning;
          if (cond && (cond.type || cond.name)) {
            workoutRows.push([
              escapeCSV(dateStr),
              escapeCSV(dow),
              escapeCSV(workout.workoutName),
              'Conditioning',
              escapeCSV(cond.name || cond.type || ''),
              escapeCSV(cond.type || ''),
              '', '',
              escapeCSV(cond.reps ?? ''),
              '',
              escapeCSV(cond.workDistance || ''),
              escapeCSV(cond.workDuration || ''),
              '', '',
              escapeCSV(cond.notes || ''),
              escapeCSV(workout.postWorkoutEnergy),
              escapeCSV(workout.notes || ''),
            ]);
          }
        }

        return workoutRows;
      });

      const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `training_log_full_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
      setLastExport(new Date().toLocaleString());
    }, 800);
  };

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  return (
    <div className="page-shell">
      {!embedded && (
        <header className="page-header">
          <div>
            <h2 className="page-title">Export Data</h2>
            <p className="page-subtitle">Take your training data with you</p>
          </div>
        </header>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <Card className="card-shell">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="text-maroon" />
              CSV Export
            </CardTitle>
            <CardDescription>
              Download your entire workout history as a spreadsheet-compatible CSV file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Includes all exercise data, running stats, energy levels, and notes. Perfect for custom analysis in Excel or Google Sheets.
            </p>
            <Button 
              onClick={handleExportCSV} 
              disabled={isExporting || history.length === 0}
              className="w-full btn-primary"
            >
              {isExporting ? "Generating..." : "Download CSV"}
              <Download size={18} className="ml-2" />
            </Button>
            {lastExport && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Last exported at {lastExport}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="card-shell">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="text-gold" />
              Print / PDF
            </CardTitle>
            <CardDescription>
              Generate a clean, print-friendly version of your training log.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Opens a formatted view optimized for printing or saving as a PDF. Great for physical backups or sharing with a coach.
            </p>
            <Button 
              variant="outline" 
              onClick={handlePrint}
              disabled={history.length === 0}
              className="w-full border-gold text-gold hover:bg-gold/5"
            >
              Print Training Log
              <Printer size={18} className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="card-shell no-print">
        <CardHeader>
          <CardTitle>Data Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your training data is stored securely in your personal account. We do not share your workout logs with third parties. Exporting your data allows you to keep a local copy for your own records.
          </p>
        </CardContent>
      </Card>

      {/* Printable Content */}
      <div className="hidden print:block space-y-8">
        <div className="border-b-2 border-foreground pb-4 mb-8">
          <h1 className="text-4xl font-bold text-foreground">Training Log History</h1>
          <p className="text-muted-foreground mt-2">Exported on {format(new Date(), 'PPP')}</p>
        </div>

        {history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(workout => (
          <div key={workout.id} className="border border-border rounded-lg p-6 space-y-4 break-inside-avoid mb-6">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{workout.workoutName}</h2>
                <div className="flex items-center gap-4 mt-1 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(workout.date), 'PPPP')}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {format(new Date(workout.date), 'p')}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-maroon uppercase tracking-wider">Energy Level</div>
                <div className="text-xl font-bold text-foreground">{workout.postWorkoutEnergy}/10</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">Exercises</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-2 font-bold">Exercise</th>
                      <th className="pb-2 font-bold">Sets</th>
                      <th className="pb-2 font-bold">Reps</th>
                      <th className="pb-2 font-bold">Weight (lbs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(workout.exercises || []).map(ex => (
                      <tr key={ex.id}>
                        <td className="py-2 font-medium text-foreground">{ex.name}</td>
                        <td className="py-2 text-muted-foreground">{ex.sets}</td>
                        <td className="py-2 text-muted-foreground">{ex.reps}</td>
                        <td className="py-2 text-muted-foreground">
                          {ex.usePerSetWeights && ex.perSetWeights 
                            ? ex.perSetWeights.join(', ') 
                            : ex.weight
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">Conditioning & Notes</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Conditioning</h4>
                    <p className="text-sm text-foreground leading-relaxed">{workout.runningStats || "None logged"}</p>
                  </div>
                  {workout.notes && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Workout Notes</h4>
                      <p className="text-sm text-muted-foreground italic leading-relaxed">"{workout.notes}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Print-only styles would go here or in index.css */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          nav, .md\\:hidden, button, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .max-w-5xl {
            max-width: 100% !important;
          }
          .card {
            border: 1px solid #eee !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
        }
      `}} />
    </div>
  );
}
