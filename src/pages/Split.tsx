/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Info, Plus, Trash2, Save, GripVertical, Check, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableExerciseBadgeProps {
  key?: string;
  exercise: string | ProgrammedExercise;
  onRemove: () => void;
}

const SortableExerciseBadge = ({ exercise, onRemove }: SortableExerciseBadgeProps) => {
  const id = typeof exercise === 'string' ? exercise : exercise.name;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const isProgrammed = typeof exercise !== 'string';

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="bg-white border border-slate-200 rounded-md p-3 flex items-center justify-between shadow-sm group"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
            <GripVertical size={16} />
          </div>
          <span className="font-medium text-slate-700">{id}</span>
        </div>
        {isProgrammed && (
          <div className="pl-9 text-xs text-slate-500 space-y-0.5">
            {exercise.sets && exercise.reps && <div>{exercise.sets}x{exercise.reps}</div>}
            {exercise.targetNotes && <div>{exercise.targetNotes}</div>}
          </div>
        )}
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-slate-400 hover:text-red-500 transition-colors"
      >
        <Trash2 size={16} />
      </button>
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

  const handleDragEnd = (event: DragEndEvent, splitId: string) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const split = splits.find(s => s.id === splitId);
      if (split) {
        const activeIndex = split.exercises.findIndex(ex => (typeof ex === 'string' ? ex : ex.name) === active.id);
        const overIndex = split.exercises.findIndex(ex => (typeof ex === 'string' ? ex : ex.name) === over.id);
        
        const newExercises = arrayMove(split.exercises, activeIndex, overIndex) as (string | ProgrammedExercise)[];
        updateSplit(splitId, { exercises: newExercises });
      }
    }
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
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Weekly Program</h2>
          <p className="text-slate-500">Choose a starting point for your training structure</p>
        </header>

        <div className="max-w-2xl mx-auto space-y-8 pt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">New Program</h3>
            <Card 
              className="border-slate-200 shadow-sm hover:border-maroon/50 cursor-pointer transition-all group"
              onClick={startFromScratch}
            >
              <CardHeader className="flex flex-row items-center gap-4 py-6">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-maroon/5 group-hover:text-maroon transition-colors">
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Preset Templates</h3>
            <div className="grid grid-cols-1 gap-4">
              {SPLIT_TEMPLATES.map((template) => (
                <Card 
                  key={template.id}
                  className="border-slate-200 shadow-sm hover:border-maroon/50 cursor-pointer transition-all group"
                  onClick={() => stageTemplateSplit(template.days)}
                >
                  <CardHeader className="flex flex-row items-center gap-4 py-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-maroon/5 group-hover:text-maroon transition-colors">
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Your Saved Programs</h3>
              <div className="grid grid-cols-1 gap-4">
                {savedSplits.map((saved) => (
                  <Card 
                    key={saved.id}
                    className="border-slate-200 shadow-sm hover:border-maroon/50 cursor-pointer transition-all group"
                    onClick={() => stageSavedSplit(saved)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-maroon/5 group-hover:text-maroon transition-colors">
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
                        className="text-slate-400 hover:text-red-500"
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
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Weekly Program</h2>
          <p className="text-slate-500">Customize your hybrid training structure</p>
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
            className="border-slate-200 text-slate-600"
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
        {days.map(dayName => {
          const split = splits.find(s => s.day === dayName);
          if (!split) return null;

          return (
            <Card key={dayName} className="border-slate-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-4">
                <div className="bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-maroon">{dayName}</h3>
                  <Textarea 
                    value={split.name}
                    onChange={e => updateSplit(split.id, { name: e.target.value })}
                    className="mt-2 font-medium text-slate-700 bg-white min-h-[40px] py-2"
                    placeholder="Program Name (e.g. Push)"
                    rows={2}
                  />
                  {stagedSplitDays === null && (
                    <Button 
                      size="sm" 
                      onClick={() => saveSplit(split)}
                      disabled={savingIds[split.id] === 'saving'}
                      className={cn(
                        "mt-4 text-white transition-all",
                        savingIds[split.id] === 'saved' ? "bg-green-600 hover:bg-green-700" : "bg-maroon hover:bg-maroon-light"
                      )}
                    >
                      {savingIds[split.id] === 'saving' ? (
                        <>Saving...</>
                      ) : savingIds[split.id] === 'saved' ? (
                        <><Check size={14} className="mr-2" /> Saved!</>
                      ) : (
                        <><Save size={14} className="mr-2" /> Save Changes</>
                      )}
                    </Button>
                  )}
                </div>
                <div className="md:col-span-3 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <LayoutGrid size={14} className="text-maroon" />
                            Workout Snapshot
                          </div>
                        </div>
                        <Textarea 
                          value={split.summary || ''}
                          onChange={e => updateSplit(split.id, { summary: e.target.value })}
                          className="min-h-[250px] text-[11px] leading-relaxed font-mono bg-white border-slate-200"
                          placeholder="Enter workout snapshot/summary..."
                        />
                      </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <Info size={14} className="text-maroon" />
                        Main Exercises
                      </div>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, split.id)}
                      >
                        <SortableContext
                          items={split.exercises.map(ex => typeof ex === 'string' ? ex : ex.name)}
                          strategy={horizontalListSortingStrategy}
                        >
                          <div className="flex flex-col gap-2 mb-4">
                            {split.exercises.map(ex => {
                              const name = typeof ex === 'string' ? ex : ex.name;
                              return (
                                <SortableExerciseBadge 
                                  key={name} 
                                  exercise={ex}
                                  onRemove={() => removeExerciseFromSplit(split.id, name)} 
                                />
                              );
                            })}
                            {split.exercises.length === 0 && (
                              <span className="text-slate-400 italic text-sm">No exercises added</span>
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>
                      <div className="flex gap-2">
                        <ExerciseSelector 
                          exercises={library}
                          value=""
                          onSelect={(ex) => addExerciseToSplit(split.id, ex.name)}
                          placeholder="Add exercise..."
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
