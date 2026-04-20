/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Info, Plus, Trash2, Save, GripVertical, Check, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ExerciseSelector } from '@/src/components/ExerciseSelector';
import { useFirebase } from '@/src/components/FirebaseProvider';
import { storage } from '@/src/services/storage';
import { Split as SplitType, ExerciseLibraryEntry, SavedSplit, ProgrammedExercise } from '@/src/types';
import { SPLIT_TEMPLATES } from '@/src/constants';
import { generateWorkoutSnapshot } from '@/src/lib/workoutUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableExerciseBadgeProps {
  key?: string;
  exercise: string | ProgrammedExercise;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ProgrammedExercise>) => void;
  onAddSuperset: (parentId: string) => void;
  onRemoveSuperset: (parentId: string, childId: string) => void;
  isParent?: boolean;
  depth?: number;
}

const SortableExerciseBadge = ({ 
  exercise, onRemove, onUpdate, onAddSuperset, onRemoveSuperset, isParent = true, depth = 0 
}: SortableExerciseBadgeProps) => {
  const isProgrammed = typeof exercise !== 'string';
  const id = isProgrammed ? exercise.name : exercise;

  const [notesOpen, setNotesOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const sets = isProgrammed ? (exercise.sets || '') : '';
  const reps = isProgrammed ? (exercise.reps || '') : '';
  const targetNotes = isProgrammed ? (exercise.targetNotes || '') : '';

  return (
    <div ref={setNodeRef} style={style} className={cn(
        "bg-card border border-border rounded-md shadow-sm group transition-all space-y-2",
        depth === 0 ? "p-3" : "p-2 ml-4 border-l-4 border-l-maroon/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isParent && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0">
              <GripVertical size={16} />
            </div>
          )}
          <span className="font-medium text-foreground truncate">{id}</span>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {isParent && (
            <Button variant="ghost" size="sm" onClick={() => onAddSuperset(id)} className="h-7 px-2 text-[10px] font-bold text-maroon hover:bg-maroon/5">
              <Plus size={12} className="mr-1" /> Superset
            </Button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onRemove(id); }} className="text-muted-foreground hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Programmed sets/reps row — always editable when exercise is programmed */}
      <div className="pl-7 flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1 flex-1">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider w-10">Sets</Label>
          <Input
            value={sets}
            onChange={e => onUpdate(id, { sets: e.target.value })}
            placeholder="3"
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-1 flex-1">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider w-10">Reps</Label>
          <Input
            value={reps}
            onChange={e => onUpdate(id, { reps: e.target.value })}
            placeholder="6-8"
            className="h-8 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={() => setNotesOpen(!notesOpen)}
          className={cn(
            "text-[10px] uppercase font-bold px-2 h-8 rounded border transition-colors",
            targetNotes || notesOpen
              ? "bg-maroon/10 text-maroon border-maroon/30"
              : "text-muted-foreground border-border hover:border-maroon/40"
          )}
          title={targetNotes ? "Edit snapshot notes" : "Add snapshot notes"}
        >
          {targetNotes ? 'Note' : '+ Note'}
        </button>
      </div>

      {/* Optional snapshot notes textarea */}
      {notesOpen && (
        <div className="pl-7" onPointerDown={(e) => e.stopPropagation()}>
          <Textarea
            value={targetNotes}
            onChange={e => onUpdate(id, { targetNotes: e.target.value })}
            placeholder="Snapshot notes for this exercise (e.g. 'Main lift — high intent', '155 was sweet spot')..."
            className="text-xs min-h-[50px]"
          />
        </div>
      )}

      {/* RECURSIVE SUPERSET DRAG AND DROP */}
      {isProgrammed && exercise.superset && exercise.superset.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-dashed border-border pl-2">
          <DndContext 
            sensors={useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))} 
            collisionDetection={closestCenter} 
            onDragEnd={(e) => {
              const { active, over } = e;
              if (!over || active.id === over.id) return;
              const activeIdx = exercise.superset!.findIndex(ex => ex.name === active.id);
              const overIdx = exercise.superset!.findIndex(ex => ex.name === over.id);
              if (activeIdx !== -1 && overIdx !== -1) {
                onUpdate(id, { superset: arrayMove(exercise.superset!, activeIdx, overIdx) });
              }
          }}>
            <SortableContext items={exercise.superset.map(ex => ex.name)} strategy={verticalListSortingStrategy}>
              {exercise.superset.map((subEx) => (
                <SortableExerciseBadge 
                  key={subEx.name}
                  exercise={subEx}
                  onRemove={(childId) => onRemoveSuperset(id, childId)}
                  onUpdate={(childId, updates) => onUpdate(id, { 
                    superset: exercise.superset!.map(s => s.name === childId ? { ...s, ...updates } : s) 
                  })}
                  onAddSuperset={() => {}} // Prevent infinite nesting
                  onRemoveSuperset={() => {}}
                  isParent={false}
                  depth={depth + 1}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

export default function Split() {
  const { user } = useFirebase();
  const [splits, setSplits] = useState<SplitType[]>([]);
  const [library, setLibrary] = useState<ExerciseLibraryEntry[]>([]);
  const [savingIds, setSavingIds] = useState<Record<string, 'saving' | 'saved' | null>>({});
  const [isSelecting, setIsSelecting] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [saveAllSuccess, setSaveAllSuccess] = useState(false);
  const [savedSplits, setSavedSplits] = useState<SavedSplit[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newSplitName, setNewSplitName] = useState('');
  const [stagedSplitDays, setStagedSplitDays] = useState<Record<string, any> | null>(null);
  const [hasAssignedSplit, setHasAssignedSplit] = useState(false);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addCardioToSplit = (splitId: string) => { console.log('Add Cardio Placeholder', splitId); };
  const addHiitToSplit = (splitId: string) => { console.log('Add HIIT Placeholder', splitId); };

  useEffect(() => {
    if (!user) return;
    
    const unsubscribeSplits = storage.subscribeToSplits(user.uid, (data) => {
      if (data.length === 0) {
        setSplits([]);
        setHasAssignedSplit(false);
      } else {
        // Handle potential duplicates from previous buggy versions
        const dayMap: Record<string, SplitType> = {};
        data.forEach(s => {
          // Rename labels if they match the old pattern
          let name = s.name;
          if (name === 'DPE-B (Quad Focus)') name = 'Quad Biased Leg Day (DPE-B)';
          if (name === 'DPE-D (Posterior)') name = 'Posterior Biased Leg Day (DPE-D)';
          
          const updatedSplit = { ...s, name };
          const isDeterministic = s.id === `${user.uid}_${s.day}`;
          // Prefer deterministic IDs or the first one found
          if (!dayMap[s.day] || isDeterministic) {
            dayMap[s.day] = updatedSplit;
          }
        });
        const uniqueSplits = Object.values(dayMap);
        const sorted = uniqueSplits.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day));
        
        const hasRealAssignedSplit = sorted.some(
          s => (s.name && s.name.trim() !== '') || (s.exercises && s.exercises.length > 0)
        );
        setHasAssignedSplit(hasRealAssignedSplit);
        
        setSplits(sorted);
      }
    });

    const unsubscribeLibrary = storage.subscribeToLibrary(user.uid, (data) => {
      setLibrary(data);
    });

    const unsubscribeSavedSplits = storage.subscribeToSavedSplits(user.uid, (data) => {
      const updatedSavedSplits = data.map(saved => {
        const updatedDays: Record<string, any> = {};
        Object.entries(saved.days).forEach(([day, data]) => {
          let name = data.name;
          if (name === 'DPE-B (Quad Focus)') name = 'Quad Biased Leg Day (DPE-B)';
          if (name === 'DPE-D (Posterior)') name = 'Posterior Biased Leg Day (DPE-D)';
          updatedDays[day] = { ...data, name };
        });
        return { ...saved, days: updatedDays };
      });
      setSavedSplits(updatedSavedSplits);
    });

    return () => {
      unsubscribeSplits();
      unsubscribeLibrary();
      unsubscribeSavedSplits();
    };
  }, [user]);

  const updateSplit = (id: string, updates: Partial<SplitType>) => {
    setSplits(prev => prev.map(s => {
      if (s.id === id) {
        const next = { ...s, ...updates };
        return next;
      }
      return s;
    }));
  };

  const saveSplit = async (split: SplitType) => {
    if (!user) return;
    setSavingIds(prev => ({ ...prev, [split.id]: 'saving' }));
    try {
      await storage.saveSplit(split, user.uid);
      setSavingIds(prev => ({ ...prev, [split.id]: 'saved' }));
      setTimeout(() => {
        setSavingIds(prev => ({ ...prev, [split.id]: null }));
      }, 2000);
    } catch (error) {
      console.error("Failed to save split:", error);
      setSavingIds(prev => ({ ...prev, [split.id]: null }));
    }
  };

  const updateProgrammedExercise = (splitId: string, exerciseName: string, updates: Partial<ProgrammedExercise>) => {
    const updateRecursive = (exs: (string | ProgrammedExercise)[]): (string | ProgrammedExercise)[] => {
      return exs.map(item => {
        if (typeof item === 'string') return item;
        if (item.name === exerciseName) return { ...item, ...updates } as ProgrammedExercise;
        if (item.superset) return { ...item, superset: updateRecursive(item.superset) as ProgrammedExercise[] } as ProgrammedExercise;
        return item;
      });
    };
    setSplits(prev => prev.map(s => s.id === splitId ? { ...s, exercises: updateRecursive(s.exercises) } : s));
  };

  const addExerciseToSplit = (splitId: string, exerciseName: string) => {
    const split = splits.find(s => s.id === splitId);
    if (split) {
      const exists = split.exercises.some(ex => (typeof ex === 'string' ? ex : ex.name) === exerciseName);
      if (!exists) {
        updateSplit(splitId, { exercises: [...split.exercises, { name: exerciseName, sets: '', reps: '', targetNotes: '' }] });
      }
    }
  };

  const removeExerciseFromSplit = (splitId: string, exerciseName: string) => {
    const split = splits.find(s => s.id === splitId);
    if (split) {
      updateSplit(splitId, { exercises: split.exercises.filter(ex => (typeof ex === 'string' ? ex : ex.name) !== exerciseName) });
    }
  };

  const addSupersetToExercise = (splitId: string, parentName: string) => {
    const addRecursive = (exs: (string | ProgrammedExercise)[]): (string | ProgrammedExercise)[] => {
      return exs.map(item => {
        if (typeof item === 'string') return item;
        if (item.name === parentName) {
          // Add a default child
          return { ...item, superset: [...(item.superset || []), { name: 'New Superset Exercise', sets: '', reps: '', targetNotes: '' }] } as ProgrammedExercise;
        }
        if (item.superset) return { ...item, superset: addRecursive(item.superset) as ProgrammedExercise[] } as ProgrammedExercise;
        return item;
      });
    };
    setSplits(prev => prev.map(s => s.id === splitId ? { ...s, exercises: addRecursive(s.exercises) } : s));
  };

  const removeSupersetChild = (splitId: string, parentName: string, childName: string) => {
    const removeRecursive = (exs: (string | ProgrammedExercise)[]): (string | ProgrammedExercise)[] => {
      return exs.map(item => {
        if (typeof item === 'string') return item;
        if (item.name === parentName && item.superset) {
          return { ...item, superset: item.superset.filter(s => s.name !== childName) } as ProgrammedExercise;
        }
        if (item.superset) return { ...item, superset: removeRecursive(item.superset) as ProgrammedExercise[] } as ProgrammedExercise;
        return item;
      });
    };
    setSplits(prev => prev.map(s => s.id === splitId ? { ...s, exercises: removeRecursive(s.exercises) } : s));
  };

  const stageTemplateSplit = (templateDays?: any) => {
    if (!user || !templateDays) return;

    const staged: SplitType[] = days.map(day => {
      const data = templateDays[day] || { name: '', running: '', exercises: [], summary: '' };
      return {
        id: `${user.uid}_${day}`,
        day,
        name: data.name || '',
        running: data.running || '',
        exercises: data.exercises || [],
        summary: data.summary || '',
        uid: user.uid,
      };
    });

    setSplits(staged);
    setStagedSplitDays(templateDays);
    setIsSelecting(false);
  };

  const stageSavedSplit = (savedSplit: SavedSplit) => {
    if (!user) return;

    const staged: SplitType[] = days.map(day => {
      const data = savedSplit.days[day] || { name: '', running: '', exercises: [], summary: '' };
      return {
        id: `${user.uid}_${day}`,
        day,
        name: data.name || '',
        running: data.running || '',
        exercises: data.exercises || [],
        summary: data.summary || '',
        uid: user.uid,
      };
    });

    setSplits(staged);
    setStagedSplitDays(savedSplit.days);
    setIsSelecting(false);
  };

  const startFromScratch = () => {
    if (!user) return;
    const emptyDays: Record<string, any> = {};
    const staged: SplitType[] = days.map(day => {
      emptyDays[day] = { name: '', running: '', exercises: [], summary: '' };
      return {
        id: `${user.uid}_${day}`,
        day,
        name: '',
        running: '',
        exercises: [],
        summary: '',
        uid: user.uid
      };
    });
    setSplits(staged);
    setStagedSplitDays(emptyDays);
    setIsSelecting(false);
  };

  const saveAllSplits = async () => {
    if (!user || !newSplitName.trim()) return;
    setSavingAll(true);
    try {
      const daysData: Record<string, { name: string; running: string; exercises: string[]; summary?: string }> = {};
      splits.forEach(s => {
        daysData[s.day] = {
          name: s.name,
          running: s.running,
          exercises: s.exercises,
          summary: s.summary
        };
      });

      const savedSplit: SavedSplit = {
        id: Math.random().toString(36).substr(2, 9),
        name: newSplitName.trim(),
        days: daysData,
        uid: user.uid,
        timestamp: Date.now()
      };

      await storage.saveSavedSplit(savedSplit, user.uid);
      
      setSaveAllSuccess(true);
      setIsSaveDialogOpen(false);
      setNewSplitName('');
      setTimeout(() => setSaveAllSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save all splits:", error);
    } finally {
      setSavingAll(false);
    }
  };



  const deleteSavedSplit = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    await storage.deleteSavedSplit(id, user.uid);
  };

  const unassignSplit = async () => {
    if (!user) return;
    
    const emptyDays: Record<string, any> = {};
    days.forEach(day => {
      emptyDays[day] = { name: '', running: '', exercises: [], summary: '' };
    });
    
    await storage.seedSplits(user.uid, emptyDays);
    
    if (user.uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_splits');
      if (saved) setSplits(JSON.parse(saved));
    }

    setSplits([]);
    setHasAssignedSplit(false);
    setStagedSplitDays(null);
    setIsSelecting(true);
  };

  const assignStagedSplit = async () => {
    if (!user) return;

    const daysData: Record<string, any> = {};
    splits.forEach(split => {
      daysData[split.day] = {
        name: split.name,
        running: split.running,
        exercises: split.exercises,
        summary: split.summary || '',
      };
    });

    await storage.seedSplits(user.uid, daysData);

    if (user.uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_splits');
      if (saved) setSplits(JSON.parse(saved));
    }

    setStagedSplitDays(null);
    setHasAssignedSplit(true);
    setIsSelecting(false);
  };

  const showSelector = (!hasAssignedSplit && !stagedSplitDays) || isSelecting;

  if (showSelector) {
    return (
      <div className="space-y-6">
        <header>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Weekly Program</h2>
          <p className="text-muted-foreground">Choose a starting point for your training structure</p>
        </header>

        <div className="max-w-2xl mx-auto space-y-8 pt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">New Program</h3>
            <Card 
              className="border-border shadow-sm hover:border-maroon/50 cursor-pointer transition-all group"
              onClick={startFromScratch}
            >
              <CardHeader className="flex flex-row items-center gap-4 py-6">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:bg-maroon/5 group-hover:text-maroon transition-colors">
                  <Plus size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl group-hover:text-maroon transition-colors">Custom Program</CardTitle>
                  <CardDescription>Build your training week from scratch, day by day.</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Preset Templates</h3>
            <div className="grid grid-cols-1 gap-4">
              {SPLIT_TEMPLATES.map((template) => (
                <Card 
                  key={template.id}
                  className="border-border shadow-sm hover:border-maroon/50 cursor-pointer transition-all group"
                  onClick={() => stageTemplateSplit(template.days)}
                >
                  <CardHeader className="flex flex-row items-center gap-4 py-6">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:bg-maroon/5 group-hover:text-maroon transition-colors">
                      <LayoutGrid size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-maroon transition-colors">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {savedSplits.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Saved Programs</h3>
              <div className="grid grid-cols-1 gap-4">
                {savedSplits.map((saved) => (
                  <Card 
                    key={saved.id}
                    className="border-border shadow-sm hover:border-maroon/50 cursor-pointer transition-all group"
                    onClick={() => stageSavedSplit(saved)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:bg-maroon/5 group-hover:text-maroon transition-colors">
                          <Calendar size={24} />
                        </div>
                        <div>
                          <CardTitle className="text-xl group-hover:text-maroon transition-colors">{saved.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <CardDescription>
                              {Object.values(saved.days).filter((d: any) => d.name && d.name !== 'Rest').map((d: any) => d.name).join(' / ')}
                            </CardDescription>
                            {saved.isAIGenerated && (
                              <Badge variant="secondary" className="text-[10px] bg-maroon/10 text-maroon">
                                AI Generated · {saved.generatedBy === 'gemini' ? 'Gemini' : 'AI'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => deleteSavedSplit(e, saved.id)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const showAssignButton = !!stagedSplitDays;
  const showUnassignButton = hasAssignedSplit;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Weekly Program</h2>
          <p className="text-muted-foreground">Customize your hybrid training structure</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showAssignButton && (
            <Button 
              onClick={assignStagedSplit}
              className="bg-maroon hover:bg-maroon-light text-white"
            >
              Assign Program
            </Button>
          )}
          {showUnassignButton && (
            <Button 
              variant="outline" 
              onClick={unassignSplit}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Unassign Program
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setIsSelecting(true)}
            className="border-border text-muted-foreground"
          >
            Go to Other Programs
          </Button>
          <Button 
            onClick={() => setIsSaveDialogOpen(true)}
            disabled={savingAll}
            className={cn(
              "text-white transition-all",
              saveAllSuccess ? "bg-green-600 hover:bg-green-700" : "bg-maroon hover:bg-maroon-light"
            )}
          >
            {savingAll ? "Saving..." : saveAllSuccess ? <><Check size={18} className="mr-2" /> Saved!</> : "Save New Custom Program"}
          </Button>
        </div>
      </header>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Program Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="split-name">Program Name</Label>
              <Input 
                id="split-name"
                placeholder="e.g. My Hypertrophy Program" 
                value={newSplitName}
                onChange={e => setNewSplitName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={saveAllSplits} 
              disabled={!newSplitName.trim() || savingAll}
              className="bg-maroon hover:bg-maroon-light"
            >
              Save Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6">
        {/* *** WORKOUT DAY CARD REDESIGN *** */}
        {splits.map(s => {
          const splitSavedState = savingIds[s.id];
          const isDeterministic = s.id === `${user!.uid}_${s.day}`;

          return (
            <Card key={s.id} className={cn("border-border shadow-md transition-all", !hasAssignedSplit && "opacity-60")}>
              {/* 1. TOP SECTION: Notes/Summary (Full Width) */}
              <CardHeader className="pb-3 border-b border-border bg-card/50">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <CardTitle className="text-xl font-extrabold text-foreground tracking-tight">{s.day}</CardTitle>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={() => saveSplit(s)} disabled={splitSavedState === 'saving'}>
                      {splitSavedState === 'saving' ? 'Saving...' : splitSavedState === 'saved' ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Snapshot Notes / Summary (across top)</Label>
                  <Textarea
                    value={s.running || ''}
                    onChange={e => updateSplit(s.id, { running: e.target.value })}
                    placeholder="Focus on volume, check RPE."
                    className="text-xs h-16 w-full"
                  />
                </div>
              </CardHeader>

              {/* 2. MIDDLE SECTION: Exercises (Stretched Full Width) */}
              <CardContent className="pt-4 pb-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter w-8">Lift (across middle)</Label>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                    const { active, over } = e;
                    if (!over || active.id === over.id) return;
                    const activeEx = s.exercises.find(ex => (typeof ex === 'string' ? ex : ex.name) === active.id);
                    const overEx = s.exercises.find(ex => (typeof ex === 'string' ? ex : ex.name) === over.id);
                    if (activeEx && overEx) {
                      const activeIndex = s.exercises.indexOf(activeEx);
                      const overIndex = s.exercises.indexOf(overEx);
                      updateSplit(s.id, { exercises: arrayMove(s.exercises, activeIndex, overIndex) as (string | ProgrammedExercise)[] });
                    }
                  }}>
                    <SortableContext items={s.exercises.map(ex => (typeof ex === 'string' ? ex : ex.name))} strategy={verticalListSortingStrategy}>
                      {s.exercises.map(ex => (
                        <SortableExerciseBadge
                          key={typeof ex === 'string' ? ex : ex.name}
                          exercise={ex}
                          onRemove={(exerciseName) => removeExerciseFromSplit(s.id, exerciseName)}
                          onUpdate={(exerciseName, updates) => updateProgrammedExercise(s.id, exerciseName, updates)}
                          onAddSuperset={(parentName) => addSupersetToExercise(s.id, parentName)}
                          onRemoveSuperset={(parentName, childName) => removeSupersetChild(s.id, parentName, childName)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              </CardContent>

              {/* 3. BOTTOM SECTION: Input Row (Full Width Across Bottom) */}
              <CardFooter className="pt-3 border-t border-border bg-card/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                  {/* Replaced openLibrary which wasn't fully defined with ExerciseSelector */}
                  <ExerciseSelector 
                    exercises={library}
                    value=""
                    onSelect={(ex) => addExerciseToSplit(s.id, ex.name)}
                    placeholder="Add Exercise..."
                    className="h-9"
                  />
                  <Button onClick={() => addHiitToSplit(s.id)} variant="ghost" size="sm" className="w-full h-9 text-xs text-muted-foreground border border-dashed border-border hover:text-foreground">
                    <Plus size={14} className="mr-1.5" /> Add HIIT
                  </Button>
                  <Button onClick={() => addCardioToSplit(s.id)} variant="ghost" size="sm" className="w-full h-9 text-xs text-muted-foreground border border-dashed border-border hover:text-foreground">
                    <Plus size={14} className="mr-1.5" /> Add Cardio
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
