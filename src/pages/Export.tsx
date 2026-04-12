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
        "Workout Name",
        "Conditioning Stats",
        "Exercise Name",
        "Muscle Group",
        "Sets",
        "Reps",
        "Weight (lbs)",
        "RPE",
        "RIR",
        "Exercise Notes",
        "Post-Workout Energy",
        "Workout Notes"
      ];

      const rows = history.flatMap(workout => 
        (workout.exercises || []).map(ex => [
          format(new Date(workout.date), 'yyyy-MM-dd'),
          `"${workout.workoutName.replace(/"/g, '""')}"`,
          `"${(workout.runningStats || '').replace(/"/g, '""')}"`,
          `"${ex.name.replace(/"/g, '""')}"`,
          ex.muscleGroup,
          ex.sets,
          ex.reps,
          ex.usePerSetWeights && ex.perSetWeights 
            ? `"${ex.perSetWeights.join(', ')}"` 
            : ex.weight,
          ex.rpe || "",
          ex.rir || "",
          `"${(ex.notes || '').replace(/"/g, '""')}"`,
          workout.postWorkoutEnergy,
          `"${(workout.notes || '').replace(/"/g, '""')}"`
        ])
      );

      const csvContent = [
        headers.join(","),
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
    <div className="space-y-6">
      {!embedded && (
        <header>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Export Data</h2>
          <p className="text-slate-500">Take your training data with you</p>
        </header>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <Card className="border-slate-200 shadow-sm">
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
            <p className="text-sm text-slate-600">
              Includes all exercise data, running stats, energy levels, and notes. Perfect for custom analysis in Excel or Google Sheets.
            </p>
            <Button 
              onClick={handleExportCSV} 
              disabled={isExporting || history.length === 0}
              className="w-full bg-maroon hover:bg-maroon-light text-white"
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

        <Card className="border-slate-200 shadow-sm">
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
            <p className="text-sm text-slate-600">
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

      <Card className="border-slate-200 shadow-sm no-print">
        <CardHeader>
          <CardTitle>Data Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Your training data is stored securely in your personal account. We do not share your workout logs with third parties. Exporting your data allows you to keep a local copy for your own records.
          </p>
        </CardContent>
      </Card>

      {/* Printable Content */}
      <div className="hidden print:block space-y-8">
        <div className="border-b-2 border-slate-900 pb-4 mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Training Log History</h1>
          <p className="text-slate-500 mt-2">Exported on {format(new Date(), 'PPP')}</p>
        </div>

        {history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(workout => (
          <div key={workout.id} className="border border-slate-200 rounded-lg p-6 space-y-4 break-inside-avoid mb-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{workout.workoutName}</h2>
                <div className="flex items-center gap-4 mt-1 text-slate-500 text-sm">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(workout.date), 'PPPP')}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {format(new Date(workout.date), 'p')}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-maroon uppercase tracking-wider">Energy Level</div>
                <div className="text-xl font-bold text-slate-900">{workout.postWorkoutEnergy}/10</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1">Exercises</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="pb-2 font-bold">Exercise</th>
                      <th className="pb-2 font-bold">Sets</th>
                      <th className="pb-2 font-bold">Reps</th>
                      <th className="pb-2 font-bold">Weight (lbs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(workout.exercises || []).map(ex => (
                      <tr key={ex.id}>
                        <td className="py-2 font-medium text-slate-700">{ex.name}</td>
                        <td className="py-2 text-slate-600">{ex.sets}</td>
                        <td className="py-2 text-slate-600">{ex.reps}</td>
                        <td className="py-2 text-slate-600">
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1">Conditioning & Notes</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-1">Conditioning</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{workout.runningStats || "None logged"}</p>
                  </div>
                  {workout.notes && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-1">Workout Notes</h4>
                      <p className="text-sm text-slate-600 italic leading-relaxed">"{workout.notes}"</p>
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
