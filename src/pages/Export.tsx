/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Download, Printer, FileText, CheckCircle2, Calendar, Clock, Upload, XCircle, RefreshCw, Database } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { storage } from '@/src/services/storage';
import { useFirebase } from '@/src/components/FirebaseProvider';
import { Workout } from '@/src/types';
import { format } from 'date-fns';
import { db } from '@/src/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { APP_VERSION } from '@/src/constants';

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

  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = async () => {
    if (!user || ('isGuest' in user && user.isGuest)) return;
    setIsExporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const getCollectionData = async (colName: string) => {
        const q = query(collection(db, colName), where('uid', '==', user.uid));
        const snap = await getDocs(q);
        return snap.docs.map(i => ({ id: i.id, ...i.data() }));
      };

      const [workouts, splits, savedSplits, exercises] = await Promise.all([
         getCollectionData('workouts'),
         getCollectionData('splits'),
         getCollectionData('saved_splits'),
         getCollectionData('exercises'),
      ]);

      const backup: any = {
        appBackupVersion: 1,
        appVersion: APP_VERSION,
        exportedAt: new Date().toISOString(),
        workouts,
        splits,
        saved_splits: savedSplits,
        exercises,
        drafts: []
      };

      try {
        const draftSnap = await getDoc(doc(db, 'drafts', user.uid));
        if (draftSnap.exists()) {
           backup.drafts = [draftSnap.data()];
        }
      } catch (e) {
         // Ignore draft read error
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `training_log_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setLastExport(new Date().toLocaleString());
    } catch (error: any) {
      if (String(error).includes('resource-exhausted')) {
        setImportError("Firestore is temporarily unavailable (Quota exceeded). Cannot export full backup right now.");
      } else {
        setImportError("Failed to export full backup: " + String(error));
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: any) => {
    setImportError(null);
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (typeof json !== 'object' || json === null) {
          throw new Error("Invalid JSON format (not an object).");
        }
        
        let summary = {
          workouts: 0,
          splits: 0,
          savedSplits: 0,
          exercises: 0,
          data: json
        };

        if (Array.isArray(json)) {
           // Legacy format: Array of workouts
           summary.workouts = json.length;
        } else {
           // New format
           summary.workouts = json.workouts?.length || 0;
           summary.splits = json.splits?.length || 0;
           summary.savedSplits = json.saved_splits?.length || 0;
           summary.exercises = json.exercises?.length || 0;
        }

        setImportSummary(summary);
      } catch (err: any) {
        setImportError("Failed to parse JSON file. " + err.message);
        setImportSummary(null);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmImport = async () => {
    if (!importSummary || !user || ('isGuest' in user && user.isGuest)) return;
    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    const { data } = importSummary;
    let itemsToWrite: { col: string, id: string, docData: any }[] = [];

    const addCollectionDocs = (colName: string, items: any[]) => {
      if (!Array.isArray(items)) return;
      items.forEach(item => {
        let docId = item.id;
        if (!docId) {
          docId = doc(collection(db, colName)).id;
        }
        const cleanData = { ...item };
        delete cleanData.id; 
        cleanData.uid = user.uid; // overwrite UID
        itemsToWrite.push({ col: colName, id: docId, docData: cleanData });
      });
    };

    if (Array.isArray(data)) {
      addCollectionDocs('workouts', data);
    } else {
      addCollectionDocs('workouts', data.workouts);
      addCollectionDocs('splits', data.splits);
      addCollectionDocs('saved_splits', data.saved_splits);
      addCollectionDocs('exercises', data.exercises);
      if (Array.isArray(data.drafts) && data.drafts.length > 0) {
        let draftData = { ...data.drafts[0] };
        delete draftData.id;
        draftData.uid = user.uid;
        itemsToWrite.push({ col: 'drafts', id: user.uid, docData: draftData });
      }
    }

    try {
      // We don't use batch here just in case it exceeds batch limits or if we want better error visibility
      for (const item of itemsToWrite) {
        const docRef = doc(db, item.col, item.id);
        await setDoc(docRef, item.docData, { merge: true });
      }
      setImportSuccess(`Successfully imported ${itemsToWrite.length} records.`);
      setImportSummary(null);
    } catch (error: any) {
      if (String(error).includes('resource-exhausted')) {
        setImportError("Import halted: Firestore quota exceeded. Try again tomorrow.");
      } else {
        setImportError("Import failed during write: " + String(error));
      }
    } finally {
      setIsImporting(false);
    }
  };

  const cancelImport = () => {
    setImportSummary(null);
    setImportError(null);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print mt-6">
        <Card className="card-shell">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="text-blue-500" />
              Full JSON Backup
            </CardTitle>
            <CardDescription>
              Export a complete backup of all your workouts, splits, programs, and exercises.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ideal for moving devices or keeping an offline backup of your progression logic.
            </p>
            <Button 
              onClick={handleExportJSON} 
              disabled={isExporting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isExporting ? "Packaging..." : "Download Full Backup"}
              <Download size={18} className="ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shell border-maroon/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="text-maroon" />
              Import Data
            </CardTitle>
            <CardDescription>
              Restore data from a previously downloaded JSON backup file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {importError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Import Error</AlertTitle>
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
            
            {importSuccess && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{importSuccess}</AlertDescription>
              </Alert>
            )}

            {!importSummary ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Select a backup file to preview before restoring.
                </p>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileChange} 
                  ref={fileInputRef}
                  className="hidden" 
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-full" variant="outline"
                >
                  Select JSON File
                  <Upload size={18} className="ml-2" />
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">Ready to import:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>{importSummary.workouts} Workouts</li>
                  <li>{importSummary.splits} Saved Days</li>
                  <li>{importSummary.savedSplits} Saved Programs</li>
                  <li>{importSummary.exercises} Custom Exercises</li>
                </ul>
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={confirmImport} 
                    disabled={isImporting}
                    className="flex-1 btn-primary"
                  >
                    {isImporting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirm
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={cancelImport}
                    disabled={isImporting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="card-shell no-print mt-6">
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
