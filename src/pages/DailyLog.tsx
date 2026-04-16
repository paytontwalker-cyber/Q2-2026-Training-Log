/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, Dispatch, SetStateAction, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  ChevronLeft, 
  ChevronRight,
  GripVertical,
  Scale,
  Check,
  LayoutGrid
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExerciseSelector } from '@/src/components/ExerciseSelector';
import { useFirebase } from '@/src/components/FirebaseProvider';
import { storage, sanitizeDraftRecord, sanitizeSplitRecord } from '@/src/services/storage';
import { 
  Workout, 
  ExerciseEntry, 
  ExerciseLibraryEntry, 
  MuscleGroup,
  Split,
  CardioType,
  LiftBlock,
  CardioBlock,
  HiitBlock,
  Block,
  CardioSubtype
} from '@/src/types';
import { INITIAL_EXERCISES, DEFAULT_SPLIT } from '@/src/constants';
import { generateWorkoutSnapshot, cleanSummary, sanitizeData, deriveBlocksFromLegacy, projectBlocksToLegacy, calculateRepeatsTotals, parseTime, calculateZone2Pace } from '@/src/lib/workoutUtils';

const NO_SPLIT_SENTINEL = '__none__';

const normalizeDistance = (value: string, unit: string): number => {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  
  switch (unit.toLowerCase()) {
    case 'miles':
    case 'mi':
      return num * 1609.34;
    case 'km':
      return num * 1000;
    case 'yards':
    case 'yd':
      return num * 0.9144;
    case 'm':
    case 'meters':
      return num;
    default:
      return 0;
  }
};

const generateConditioningSummary = (cond: any): string => {
  if (!cond || !cond.type) return '';
  let summary = `${cond.type}: ${cond.name || 'Unnamed'}`;
  if (cond.reps) summary += ` | ${cond.reps} reps`;
  if (cond.workDistance || cond.workDuration) summary += ` @ ${cond.workDistance || cond.workDuration}${cond.workUnits ? ' ' + cond.workUnits : ''}`;
  if (cond.restType && cond.restType !== 'none') summary += ` (Rest: ${cond.restValue})`;
  return summary;
};

export interface SortableExerciseCardProps {
  key?: string;
  ex: ExerciseEntry;
  library: ExerciseLibraryEntry[];
  updateExercise: (id: string, updates: Partial<ExerciseEntry>) => void;
  removeExercise: (id: string) => void;
  toggleNotes: (id: string) => void;
  isExpanded: boolean;
  updateSuperset: (id: string, updates: Partial<ExerciseEntry> | null) => void;
  expandedSupersets: Record<string, boolean>;
  setExpandedSupersets: Dispatch<SetStateAction<Record<string, boolean>>>;
}

const SortableExerciseCard = ({ 
  ex, 
  library, 
  updateExercise, 
  removeExercise, 
  toggleNotes, 
  isExpanded,
  updateSuperset,
  expandedSupersets,
  setExpandedSupersets
}: SortableExerciseCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: ex.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `superset-drop-${ex.id}`,
    disabled: !expandedSupersets[ex.id]
  });

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "border-border shadow-sm relative group transition-shadow",
        isDragging && "shadow-lg border-maroon/30"
      )}
    >
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* Drag Handle & Exercise Selector */}
          <div className="w-full md:w-[40%] flex gap-3">
            <div 
              {...attributes} 
              {...listeners} 
              className="mt-7 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <GripVertical size={20} />
            </div>
            <div className="flex-1 min-w-0" onPointerDown={e => e.stopPropagation()}>
              <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Exercise</Label>
              <ExerciseSelector 
                exercises={library}
                value={ex.name}
                onSelect={(libEx) => updateExercise(ex.id, { 
                  name: libEx.name, 
                  muscleGroup: libEx.muscleGroup,
                  muscleDistribution: libEx.muscleDistribution,
                  trackingMode: libEx.trackingMode,
                  timeUnit: 'min'
                })}
              />
            </div>
          </div>
          
          {/* Input Fields Grid */}
          <div className="w-full md:flex-1 grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
            <div className="min-w-0">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block truncate">Sets</Label>
              <Input 
                type="number" 
                value={ex.sets || ''} 
                    onChange={e => {
                      const val = e.target.value.replace(/^0+(?=\d)/, '');
                      const newSets = val === '' ? 0 : parseInt(val);
                      const updates: Partial<ExerciseEntry> = { sets: newSets };
                      if (ex.usePerSetWeights) {
                        const newWeights = [...(ex.perSetWeights || [])];
                        if (newWeights.length < newSets) {
                          for (let i = newWeights.length; i < newSets; i++) newWeights.push(ex.weight || 0);
                        } else if (newWeights.length > newSets) {
                          newWeights.length = newSets;
                        }
                        updates.perSetWeights = newWeights;
                      }
                      updateExercise(ex.id, updates);
                    }}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                className="h-9 w-full"
              />
            </div>
            {ex.trackingMode === 'distance' ? (
              <>
                <div className="min-w-0">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block truncate">Dist</Label>
                  <Input 
                    type="number" 
                    value={ex.distance || ''} 
                    onChange={e => {
                      const val = e.target.value.replace(/^0+(?=\d)/, '');
                      updateExercise(ex.id, { distance: val === '' ? 0 : parseFloat(val) });
                    }}
                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                    className="h-9 w-full"
                  />
                </div>
                <div className="min-w-0">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block truncate">Unit</Label>
                  <Select
                    value={ex.distanceUnit || 'm'}
                    onValueChange={(val: any) => updateExercise(ex.id, { distanceUnit: val })}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="yd">yd</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                      <SelectItem value="mi">mi</SelectItem>
                      <SelectItem value="km">km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : ex.trackingMode === 'time' ? (
              <div className="min-w-0">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block truncate">
                  TIME ({ex.timeUnit === 'sec' ? 'SEC' : 'MIN'})
                </Label>
                <Input 
                  type="number" 
                  value={ex.time || ''} 
                  onChange={e => {
                    const val = e.target.value.replace(/^0+(?=\d)/, '');
                    updateExercise(ex.id, { time: val === '' ? 0 : parseFloat(val) });
                  }}
                  onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                  className="h-9 w-full"
                />
              </div>
            ) : (
              <div className="min-w-0">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block truncate">Reps</Label>
                <Input 
                  type="number" 
                  value={ex.reps || ''} 
                  onChange={e => {
                    const val = e.target.value.replace(/^0+(?=\d)/, '');
                    updateExercise(ex.id, { reps: val === '' ? 0 : parseInt(val) });
                  }}
                  onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                  className="h-9 w-full"
                />
              </div>
            )}
            <div className="min-w-0">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block truncate">Weight (lbs)</Label>
              {ex.usePerSetWeights ? (
                <div className="flex items-center h-9 text-[10px] text-muted-foreground font-medium italic">
                  Per-set active
                </div>
              ) : (
                <Input 
                  type="number" 
                  value={ex.weight || ''} 
                  onChange={e => {
                    const val = e.target.value.replace(/^0+(?=\d)/, '');
                    updateExercise(ex.id, { weight: val === '' ? 0 : parseFloat(val) });
                  }}
                  onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                  className="h-9 w-full"
                />
              )}
            </div>
            <div className="min-w-0">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block truncate">RPE</Label>
              <Input 
                type="number" 
                step="0.5"
                value={ex.rpe || ''} 
                onChange={e => {
                  const val = e.target.value;
                  updateExercise(ex.id, { rpe: val === '' ? null : parseFloat(val) });
                }}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                className="h-9 w-full"
              />
            </div>
            <div className="min-w-0">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block truncate">RIR</Label>
              <Input 
                type="number" 
                value={ex.rir || ''} 
                onChange={e => {
                  const val = e.target.value;
                  updateExercise(ex.id, { rir: val === '' ? null : parseInt(val) });
                }}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                className="h-9 w-full"
              />
            </div>
          </div>
        </div>

        {ex.usePerSetWeights && ex.sets > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg border border-border">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">Individual Set Weights (lbs)</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: ex.sets }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[9px] text-muted-foreground font-bold text-center">S{i+1}</span>
                  <Input 
                    type="number"
                    value={ex.perSetWeights?.[i] ?? ex.weight ?? ''}
                    onChange={e => {
                      const newWeights = [...(ex.perSetWeights || Array(ex.sets).fill(''))];
                      newWeights[i] = e.target.value.replace(/^0+(?=\d)/, '');
                      updateExercise(ex.id, { perSetWeights: newWeights });
                    }}
                    className="h-8 w-16 text-xs text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => toggleNotes(ex.id)}
              className="text-muted-foreground h-8 px-2"
            >
              {isExpanded ? <ChevronUp size={14} className="mr-1" /> : <ChevronDown size={14} className="mr-1" />}
              {isExpanded ? 'Hide Notes' : 'Add Notes'}
            </Button>
            
            <Select
              value={ex.trackingMode || 'reps'}
              onValueChange={(val: any) => updateExercise(ex.id, { trackingMode: val })}
            >
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reps">Reps</SelectItem>
                <SelectItem value="distance">Dist</SelectItem>
                <SelectItem value="time">Time</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                const usePerSet = !ex.usePerSetWeights;
                const updates: Partial<ExerciseEntry> = { usePerSetWeights: usePerSet };
                if (usePerSet && !ex.perSetWeights) {
                  updates.perSetWeights = Array(ex.sets || 0).fill('');
                }
                updateExercise(ex.id, updates);
              }}
              className={cn(
                "h-8 px-2 text-xs",
                ex.usePerSetWeights ? "text-maroon bg-maroon/5" : "text-muted-foreground"
              )}
            >
              <Scale size={14} className="mr-1" />
              {ex.usePerSetWeights ? 'Using Per-Set' : 'Use Per-Set Weights'}
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                if (ex.superset) {
                  setExpandedSupersets(prev => ({ ...prev, [ex.id]: !prev[ex.id] }));
                } else {
                  updateSuperset(ex.id, {
                    id: Math.random().toString(36).substr(2, 9),
                    name: '',
                    muscleGroup: 'Other',
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight,
                    rpe: ex.rpe,
                    rir: ex.rir,
                    notes: '',
                  });
                  setExpandedSupersets(prev => ({ ...prev, [ex.id]: true }));
                }
              }}
              className={cn(
                "h-8 px-2 text-xs",
                ex.superset ? "text-maroon bg-maroon/5" : "text-muted-foreground"
              )}
            >
              <Plus size={14} className="mr-1" />
              {ex.superset ? (expandedSupersets[ex.id] ? 'Hide Superset' : 'Show Superset') : 'Superset'}
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              removeExercise(ex.id);
              setExpandedSupersets(prev => {
                const next = { ...prev };
                delete next[ex.id];
                return next;
              });
            }}
            className="text-muted-foreground hover:text-destructive h-8 px-2"
          >
            <Trash2 size={14} />
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-2">
            <Textarea 
              value={ex.notes}
              onChange={e => updateExercise(ex.id, { notes: e.target.value })}
              placeholder="Set details, form cues, etc..."
              className="text-sm min-h-[60px]"
            />
          </div>
        )}

        {ex.superset && expandedSupersets[ex.id] && (
          <div 
            ref={setDropRef}
            className={cn(
              "mt-4 p-4 bg-muted rounded-xl border border-border space-y-4 transition-all duration-200",
              isOver && "bg-muted border-border ring-2 ring-border scale-[1.01]"
            )}
          >
            <div className="flex items-center justify-between">
              <Label className={cn(
                "text-[10px] uppercase font-bold transition-colors",
                isOver ? "text-muted-foreground" : "text-muted-foreground"
              )}>
                {isOver ? "Drop to Superset" : "Superset Exercise"}
              </Label>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => updateSuperset(ex.id, null)}
                className="h-6 w-6 text-muted-foreground hover:text-red-500"
              >
                <Trash2 size={12} />
              </Button>
            </div>
            
            <div className={cn(
              "flex flex-col md:flex-row gap-4 items-start transition-opacity",
              isOver && "opacity-50"
            )}>
              <div className="w-full md:w-[40%]" onPointerDown={e => e.stopPropagation()}>
                <ExerciseSelector 
                  exercises={library}
                  value={ex.superset.name}
                  onSelect={(libEx) => updateSuperset(ex.id, { 
                    ...ex.superset, 
                    name: libEx.name, 
                    muscleGroup: libEx.muscleGroup,
                    muscleDistribution: libEx.muscleDistribution 
                  })}
                />
              </div>
              
              <div className="w-full md:flex-1 grid grid-cols-3 md:grid-cols-5 gap-2">
                {ex.superset.trackingMode === 'distance' ? (
                  <>
                    <div>
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">Distance</Label>
                      <Input 
                        type="number" 
                        value={ex.superset.distance || ''} 
                        onChange={e => updateSuperset(ex.id, { ...ex.superset, distance: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">Time</Label>
                      <Input 
                        type="number" 
                        value={ex.superset.time || ''} 
                        onChange={e => updateSuperset(ex.id, { ...ex.superset, time: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">Sets</Label>
                      <Input 
                        type="number" 
                        value={ex.superset.sets || ''} 
                        onChange={e => updateSuperset(ex.id, { ...ex.superset, sets: parseInt(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">Reps</Label>
                      <Input 
                        type="number" 
                        value={ex.superset.reps || ''} 
                        onChange={e => updateSuperset(ex.id, { ...ex.superset, reps: parseInt(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">Weight</Label>
                      <Input 
                        type="number" 
                        value={ex.superset.weight || ''} 
                        onChange={e => updateSuperset(ex.id, { ...ex.superset, weight: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">RPE</Label>
                  <Input 
                    type="number" 
                    step="0.5"
                    value={ex.superset.rpe || ''} 
                    onChange={e => updateSuperset(ex.id, { ...ex.superset, rpe: parseFloat(e.target.value) || null })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">RIR</Label>
                  <Input 
                    type="number" 
                    value={ex.superset.rir || ''} 
                    onChange={e => updateSuperset(ex.id, { ...ex.superset, rir: parseInt(e.target.value) || null })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
            <Textarea 
              value={ex.superset.notes}
              onChange={e => updateSuperset(ex.id, { ...ex.superset, notes: e.target.value })}
              placeholder="Superset notes..."
              className={cn(
                "text-xs min-h-[40px] bg-card/50 transition-opacity",
                isOver && "opacity-50"
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface SortableConditioningBlockProps {
  block: CardioBlock | HiitBlock;
  onChange: (updates: Partial<CardioBlock | HiitBlock>) => void;
  onDelete: () => void;
  library: ExerciseLibraryEntry[];
  updateHiitExercise: (blockId: string, exerciseId: string, updates: Partial<ExerciseEntry>) => void;
  removeHiitExercise: (blockId: string, exerciseId: string) => void;
  addHiitExercise: (blockId: string) => void;
}

const SortableConditioningBlock: React.FC<SortableConditioningBlockProps> = ({
  block,
  onChange,
  onDelete,
  library,
  updateHiitExercise,
  removeHiitExercise,
  addHiitExercise,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "border-border shadow-sm relative group transition-shadow",
        isDragging && "shadow-lg border-maroon/30"
      )}
    >
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div 
            {...attributes} 
            {...listeners} 
            className="mt-7 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <GripVertical size={20} />
          </div>
          <div className="flex-1 min-w-0 space-y-4" onPointerDown={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {block.kind === 'hiit' ? 'HIIT Block' : 'Cardio Block'}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-6 text-[10px] text-muted-foreground hover:text-red-500"
              >
                Remove
              </Button>
            </div>

            {block.kind === 'cardio' ? (
              <div className="space-y-4">
                <Select
                  value={block.subtype ?? ''}
                  onValueChange={(val) => onChange({ subtype: val as CardioSubtype })}
                >
                  <SelectTrigger className="h-9 w-full md:w-64">
                    <SelectValue placeholder="Select cardio type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Repeats">Repeats</SelectItem>
                    <SelectItem value="Ladders">Ladders</SelectItem>
                    <SelectItem value="Intervals">Intervals</SelectItem>
                    <SelectItem value="Zone 2">Zone 2</SelectItem>
                    <SelectItem value="Incline Treadmill">Incline Treadmill</SelectItem>
                    <SelectItem value="Bike">Bike</SelectItem>
                    <SelectItem value="Ruck">Ruck</SelectItem>
                  </SelectContent>
                </Select>

                {block.subtype && (
                  <div className="space-y-4">
                    {block.subtype === 'Repeats' ? (
                      <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Splits</Label>
                            <Input type="number" value={block.splitCount ?? ''} onChange={(e) => {
                              const count = parseInt(e.target.value) || 0;
                              const newSplits = Array(count).fill(0).map((_, i) => block.splits?.[i] || { distanceVal: 0, distanceUnit: 'm', timeStr: '0:00' });
                              onChange({ splitCount: count, splits: newSplits });
                            }} className="h-9" />
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Rest</Label>
                            <div className="flex gap-2">
                              <Input type="number" value={block.restValue ?? ''} onChange={(e) => onChange({ restValue: parseFloat(e.target.value) || 0 })} className="h-9" />
                              <Select value={block.restUnit ?? 'sec'} onValueChange={(val) => onChange({ restUnit: val })}>
                                <SelectTrigger className="h-9 w-20"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="sec">sec</SelectItem><SelectItem value="min">min</SelectItem><SelectItem value="m">m</SelectItem><SelectItem value="yd">yd</SelectItem><SelectItem value="mi">mi</SelectItem></SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Avg HR</Label>
                            <Input type="number" value={block.averageHeartRate ?? ''} onChange={(e) => onChange({ averageHeartRate: parseInt(e.target.value) || 0 })} className="h-9" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground block">Splits</Label>
                          {block.splits?.map((split, i) => (
                            <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center bg-card p-2 rounded border border-border">
                              <div className="text-xs font-bold text-muted-foreground">Split {i + 1}</div>
                              <div className="flex gap-1">
                                <Input type="number" value={split.distanceVal} onChange={(e) => {
                                  const newSplits = [...(block.splits || [])];
                                  newSplits[i] = { ...split, distanceVal: parseFloat(e.target.value) || 0 };
                                  onChange({ splits: newSplits });
                                }} className="h-8" />
                                <Select value={split.distanceUnit} onValueChange={(val) => {
                                  const newSplits = [...(block.splits || [])];
                                  newSplits[i] = { ...split, distanceUnit: val };
                                  onChange({ splits: newSplits });
                                }}>
                                  <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
                                  <SelectContent><SelectItem value="m">m</SelectItem><SelectItem value="yd">yd</SelectItem><SelectItem value="km">km</SelectItem><SelectItem value="mi">mi</SelectItem></SelectContent>
                                </Select>
                              </div>
                              <Input value={split.timeStr} onChange={(e) => {
                                const newSplits = [...(block.splits || [])];
                                newSplits[i] = { ...split, timeStr: e.target.value };
                                onChange({ splits: newSplits });
                              }} placeholder="3:35" className="h-8" />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Total Dist</Label>
                            <div className="h-9 flex items-center font-mono text-sm">{block.splits?.reduce((sum, s) => sum + s.distanceVal, 0) || 0} {block.splits?.[0]?.distanceUnit || 'm'}</div>
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Total Time</Label>
                            <div className="h-9 flex items-center font-mono text-sm">
                              {(() => {
                                const totals = calculateRepeatsTotals(block.splits || []);
                                return totals.totalTimeStr;
                              })()}
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Avg Time/Split</Label>
                            <div className="h-9 flex items-center font-mono text-sm">
                              {(() => {
                                const totals = calculateRepeatsTotals(block.splits || []);
                                return totals.avgTimePerSplitStr;
                              })()}
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Avg Pace</Label>
                            <div className="h-9 flex items-center font-mono text-sm">
                              {(() => {
                                const totals = calculateRepeatsTotals(block.splits || []);
                                return `${totals.paceStr} / ${block.splits?.[0]?.distanceUnit || 'm'}`;
                              })()}
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Notes</Label>
                          <Textarea value={block.programmedNotes ?? ''} onChange={(e) => onChange({ programmedNotes: e.target.value })} placeholder="Repeats notes..." className="min-h-[60px] text-xs" />
                        </div>
                      </div>
                    ) : block.subtype === 'Zone 2' ? (
                      <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Distance</Label>
                            <div className="flex gap-2">
                              <Input type="number" value={block.programmedDistanceVal ?? ''} onChange={(e) => onChange({ programmedDistanceVal: parseFloat(e.target.value) || 0 })} className="h-9" />
                              <Select value={block.programmedDistanceUnit ?? 'mi'} onValueChange={(val) => onChange({ programmedDistanceUnit: val })}>
                                <SelectTrigger className="h-9 w-20"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="m">m</SelectItem><SelectItem value="yd">yd</SelectItem><SelectItem value="km">km</SelectItem><SelectItem value="mi">mi</SelectItem></SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Time</Label>
                            <div className="flex gap-2">
                              <Input value={block.zone2TimeStr ?? ''} onChange={(e) => onChange({ zone2TimeStr: e.target.value })} placeholder="30:00" className="h-9" />
                              <div className="h-9 flex items-center text-xs text-muted-foreground">min</div>
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Avg HR</Label>
                            <Input type="number" value={block.zone2AverageHeartRate ?? ''} onChange={(e) => onChange({ zone2AverageHeartRate: parseInt(e.target.value) || 0 })} className="h-9" />
                          </div>
                        </div>
                        <div className="pt-4 border-t border-border">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Avg Pace</Label>
                          <div className="h-9 flex items-center font-mono text-sm">
                            {calculateZone2Pace(block.programmedDistanceVal || 0, block.programmedDistanceUnit || 'mi', block.zone2TimeStr || '0:00')}
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Notes</Label>
                          <Textarea value={block.programmedNotes ?? ''} onChange={(e) => onChange({ programmedNotes: e.target.value })} placeholder="Zone 2 notes..." className="min-h-[60px] text-xs" />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Existing cardio UI */}
                        <div>
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Name</Label>
                          <Input
                            value={block.programmedName ?? ''}
                            onChange={(e) => onChange({ programmedName: e.target.value })}
                            placeholder="e.g. Zone 2 Run"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Duration</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={block.programmedDurationVal ?? ''}
                              onChange={(e) => onChange({ programmedDurationVal: parseFloat(e.target.value) || 0 })}
                              placeholder="45"
                              className="h-9"
                            />
                            <Select
                              value={block.programmedDurationUnit ?? 'min'}
                              onValueChange={(val) => onChange({ programmedDurationUnit: val })}
                            >
                              <SelectTrigger className="h-9 w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="min">min</SelectItem>
                                <SelectItem value="sec">sec</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {block.subtype !== 'Incline Treadmill' && (
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Distance</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                value={block.programmedDistanceVal ?? ''}
                                onChange={(e) => onChange({ programmedDistanceVal: parseFloat(e.target.value) || 0 })}
                                placeholder="3"
                                className="h-9"
                              />
                              <Select
                                value={block.programmedDistanceUnit ?? 'mi'}
                                onValueChange={(val) => onChange({ programmedDistanceUnit: val })}
                              >
                                <SelectTrigger className="h-9 w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mi">mi</SelectItem>
                                  <SelectItem value="km">km</SelectItem>
                                  <SelectItem value="m">m</SelectItem>
                                  <SelectItem value="yd">yd</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                        {block.subtype === 'Incline Treadmill' && (
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Incline / Target</Label>
                            <Input
                              value={block.programmedNotes ?? ''}
                              onChange={(e) => onChange({ programmedNotes: e.target.value })}
                              placeholder="e.g. 12% incline"
                              className="h-9"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {block.subtype !== 'Incline Treadmill' && block.subtype !== 'Repeats' && block.subtype !== 'Zone 2' && (
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Notes</Label>
                        <Textarea
                          value={block.programmedNotes ?? ''}
                          onChange={(e) => onChange({ programmedNotes: e.target.value })}
                          placeholder="Cardio notes..."
                          className="min-h-[60px] text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Select
                  value={block.hiitType ?? ''}
                  onValueChange={(val) => onChange({ hiitType: val as any })}
                >
                  <SelectTrigger className="h-9 w-full md:w-64">
                    <SelectValue placeholder="Select HIIT type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="METCON">METCON</SelectItem>
                    <SelectItem value="AMRAP">AMRAP</SelectItem>
                    <SelectItem value="EMOM">EMOM</SelectItem>
                  </SelectContent>
                </Select>

                <div>
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Structure / Notes</Label>
                  <Textarea
                    value={block.structureNotes ?? ''}
                    onChange={(e) => onChange({ structureNotes: e.target.value })}
                    placeholder="e.g. 5 rounds for time..."
                    className="min-h-[60px] text-xs"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Exercises</Label>
                  {(block.exercises || []).map((ex) => (
                    <div key={ex.id} className="flex flex-col md:flex-row gap-3 items-start bg-muted p-3 rounded-md border border-border">
                      <div className="w-full md:w-[40%]">
                        <ExerciseSelector 
                          exercises={library}
                          value={ex.name}
                          onSelect={(libEx) => updateHiitExercise(block.id, ex.id, { 
                            name: libEx.name, 
                            muscleGroup: libEx.muscleGroup,
                            muscleDistribution: libEx.muscleDistribution,
                            trackingMode: libEx.trackingMode,
                            timeUnit: 'min'
                          })}
                        />
                      </div>
                      <div className="w-full md:flex-1 grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">Sets</Label>
                          <Input 
                            type="number" 
                            value={ex.sets !== undefined && ex.sets !== null ? ex.sets : ''} 
                            onChange={e => updateHiitExercise(block.id, ex.id, { sets: parseInt(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">Reps</Label>
                          <Input 
                            type="number" 
                            value={ex.reps !== undefined && ex.reps !== null ? ex.reps : ''} 
                            onChange={e => updateHiitExercise(block.id, ex.id, { reps: parseInt(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">Weight</Label>
                          <Input 
                            type="number" 
                            value={ex.weight !== undefined && ex.weight !== null ? ex.weight : ''} 
                            onChange={e => updateHiitExercise(block.id, ex.id, { weight: parseFloat(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeHiitExercise(block.id, ex.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addHiitExercise(block.id)} className="border-dashed border-border text-xs">
                    <Plus size={14} className="mr-1" /> Add HIIT Exercise
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SortableLiftBlockProps {
  block: LiftBlock;
  library: ExerciseLibraryEntry[];
  updateExercise: (id: string, updates: Partial<ExerciseEntry>) => void;
  removeExercise: (id: string) => void;
  toggleNotes: (id: string) => void;
  expandedNotes: Record<string, boolean>;
  updateSuperset: (id: string, updates: Partial<ExerciseEntry> | null) => void;
  expandedSupersets: Record<string, boolean>;
  setExpandedSupersets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const SortableLiftBlock: React.FC<SortableLiftBlockProps> = ({
  block,
  library,
  updateExercise,
  removeExercise,
  toggleNotes,
  expandedNotes,
  updateSuperset,
  expandedSupersets,
  setExpandedSupersets
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-4 relative">
      <div 
        {...attributes} 
        {...listeners}
        className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-muted-foreground hidden md:block"
      >
        <GripVertical size={20} />
      </div>
      <SortableContext 
        items={block.exercises.map(ex => ex.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {block.exercises.map((ex) => (
            <SortableExerciseCard 
              key={ex.id}
              ex={ex}
              library={library}
              updateExercise={updateExercise}
              removeExercise={removeExercise}
              toggleNotes={toggleNotes}
              isExpanded={!!expandedNotes[ex.id]}
              updateSuperset={updateSuperset}
              expandedSupersets={expandedSupersets}
              setExpandedSupersets={setExpandedSupersets}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default function DailyLog() {
  const { user } = useFirebase();
  const [date, setDate] = useState(new Date());
  const [workoutMeta, setWorkoutMeta] = useState<Partial<Workout>>({
    workoutName: '',
    workoutSummary: '',
    runningStats: '',
    postWorkoutEnergy: 5,
    notes: '',
    id: '',
    isHistorical: false,
  });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [library, setLibrary] = useState<ExerciseLibraryEntry[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [expandedSupersets, setExpandedSupersets] = useState<Record<string, boolean>>({});
  const [manualSplit, setManualSplit] = useState<string | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  interface WorkoutSnapshot {
    workoutMeta: Partial<Workout>;
    blocks: Block[];
    manualSplit: string | null;
    date: Date;
    expandedSupersets: Record<string, boolean>;
    expandedNotes: Record<string, boolean>;
  }
  const [previousSnapshot, setPreviousSnapshot] = useState<WorkoutSnapshot | null>(null);

  const captureSnapshot = () => {
    setPreviousSnapshot({
      workoutMeta: { ...workoutMeta },
      blocks: JSON.parse(JSON.stringify(blocks)),
      manualSplit,
      date: new Date(date),
      expandedSupersets: { ...expandedSupersets },
      expandedNotes: { ...expandedNotes },
    });
  };

  const runWithUndo = (fn: () => void) => {
    captureSnapshot();
    fn();
  };

  const isEditingRef = useRef(false);

  const beginUndoableEdit = () => {
    if (!isEditingRef.current) {
      captureSnapshot();
      isEditingRef.current = true;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      isEditingRef.current = false;
    }, 500);
    return () => clearTimeout(timer);
  }, [workoutMeta, blocks, manualSplit, date]);

  const handleUndo = () => {
    if (!previousSnapshot) return;

    const currentSnapshot: WorkoutSnapshot = {
      workoutMeta: { ...workoutMeta },
      blocks: JSON.parse(JSON.stringify(blocks)),
      manualSplit,
      date: new Date(date),
      expandedSupersets: { ...expandedSupersets },
      expandedNotes: { ...expandedNotes },
    };

    setWorkoutMeta(previousSnapshot.workoutMeta);
    setBlocks(previousSnapshot.blocks);
    setManualSplit(previousSnapshot.manualSplit);
    setDate(new Date(previousSnapshot.date));
    setExpandedSupersets(previousSnapshot.expandedSupersets);
    setExpandedNotes(previousSnapshot.expandedNotes);

    setPreviousSnapshot(currentSnapshot);
  };

  const liftBlock = blocks.find((b): b is LiftBlock => b.kind === 'lift');
  const liftExercises = liftBlock?.exercises ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load draft on mount
  useEffect(() => {
    if (!user || isDraftLoaded) return;
    const unsubscribe = storage.subscribeToDraft(user.uid, (draft: any) => {
      if (!isDraftLoaded) {
        if (draft) {
          const sanitizedDraft = sanitizeDraftRecord(draft);
          if (sanitizedDraft) {
            setWorkoutMeta(prev => ({ ...prev, ...sanitizedDraft }));
            if (sanitizedDraft.blocks) {
              setBlocks(sanitizedDraft.blocks);
            } else {
              setBlocks(deriveBlocksFromLegacy(sanitizedDraft.exercises || [], sanitizedDraft.conditioning));
            }
            
            if (sanitizedDraft.isHistorical) {
              setWorkoutMeta(prev => ({ ...prev, isHistorical: true }));
            }
            
            if (draft.expandedSupersets) {
              setExpandedSupersets(draft.expandedSupersets);
            }

            if (sanitizedDraft.date) {
              const d = new Date(sanitizedDraft.date);
              setDate(d);
              // Update ref to prevent split reload overwriting draft
              lastLoadedRef.current.date = format(d, 'yyyy-MM-dd');
            }
          }
        }
        setIsDraftLoaded(true);
      }
    });
    return () => unsubscribe();
  }, [user, isDraftLoaded]);

  // Auto-save draft
  useEffect(() => {
    if (!user || !isDraftLoaded) return;
    const timer = setTimeout(() => {
      // Sanitize data to remove undefined values which can break Firestore
      const draftToSave = sanitizeData({ 
        ...workoutMeta, 
        blocks,
        date: date.toISOString(),
        expandedSupersets 
      });
      storage.saveDraft(draftToSave, user.uid);
    }, 1000);
    return () => clearTimeout(timer);
  }, [workoutMeta, blocks, date, user, isDraftLoaded, expandedSupersets]);

  // Subscribe to library
  useEffect(() => {
    if (!user) return;
    const unsubscribe = storage.subscribeToLibrary(user.uid, (data) => {
      if (data.length === 0) {
        // Seed if empty
        storage.seedLibrary(user.uid);
      } else {
        setLibrary(data);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Subscribe to splits
  useEffect(() => {
    if (!user) return;
    const isGuest = 'isGuest' in user;
    const unsubscribe = storage.subscribeToSplits(user.uid, (data) => {
      if (data.length === 0 && isGuest) {
        // Only auto-seed for guests
        storage.seedSplits(user.uid);
      } else {
        const dayMap: Record<string, Split> = {};
        data.forEach(s => {
          // Rename labels if they match the old pattern
          let name = s.name;
          if (name === 'DPE-B (Quad Focus)') name = 'Quad Biased Leg Day (DPE-B)';
          if (name === 'DPE-D (Posterior)') name = 'Posterior Biased Leg Day (DPE-D)';
          
          const updatedSplit = { ...s, name };
          const isDeterministic = s.id === `${user.uid}_${s.day}`;
          if (!dayMap[s.day] || isDeterministic) {
            dayMap[s.day] = updatedSplit;
          }
        });
        setSplits(Object.values(dayMap));
      }
    });
    return () => unsubscribe();
  }, [user]);

  const lastLoadedRef = useRef<{ date: string; split: string | null; splitDataHash: string | null }>({ 
    date: format(date, 'yyyy-MM-dd'), 
    split: manualSplit,
    splitDataHash: null
  });

  const getSplitForDate = useCallback((targetDate: Date, splitName: string | null) => {
    if (splitName === NO_SPLIT_SENTINEL) return null;
    if (library.length === 0 || splits.length === 0) return null;

    let currentSplit;
    if (splitName) {
      currentSplit = splits.find(s => s.name === splitName);
    } else {
      const dayName = format(targetDate, 'EEEE');
      currentSplit = splits.find(s => s.day === dayName);
    }

    if (!currentSplit) return null;

    const sanitizedSplit = sanitizeSplitRecord(currentSplit);
    if (!sanitizedSplit) return null;

    return { currentSplit, sanitizedSplit };
  }, [library, splits]);

  const loadProgrammedWorkout = useCallback((targetDate: Date, splitName: string | null) => {
    if (splitName === NO_SPLIT_SENTINEL) {
      setWorkoutMeta(prev => ({
        ...prev,
        workoutName: '',
        workoutSummary: '',
        runningStats: '',
        notes: '',
      }));
      setBlocks([]);
      setExpandedSupersets({});
      return;
    }

    const splitData = getSplitForDate(targetDate, splitName);
    if (!splitData) return;
    const { currentSplit, sanitizedSplit } = splitData;

    const defaultExercises: ExerciseEntry[] = sanitizedSplit.exercises.map(ex => {
      const name = typeof ex === 'string' ? ex : ex.name;
      const libEx = library.find(e => e.name === name);
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        muscleGroup: libEx?.muscleGroup || 'Other',
        muscleDistribution: libEx?.muscleDistribution,
        trackingMode: libEx?.trackingMode || 'reps',
        sets: 0,
        reps: 0,
        distance: 0,
        time: 0,
        timeUnit: 'min',
        weight: 0,
        rpe: null,
        rir: null,
        notes: '',
      };
    });

    setWorkoutMeta(prev => ({
      ...prev,
      workoutName: currentSplit.name,
      workoutSummary: currentSplit.summary || '',
      runningStats: currentSplit.running,
    }));
    setBlocks(deriveBlocksFromLegacy(defaultExercises, { name: '' }));
    setExpandedSupersets({});
    
    return { currentSplit, sanitizedSplit };
  }, [getSplitForDate, library]);

  // Load default split based on date or manual selection
  useEffect(() => {
    if (manualSplit === NO_SPLIT_SENTINEL) {
      // User explicitly chose no split — do not auto-populate anything.
      // Update the lastLoadedRef so subsequent runs don't re-trigger auto-population.
      lastLoadedRef.current = {
        date: format(date, 'yyyy-MM-dd'),
        split: NO_SPLIT_SENTINEL,
        splitDataHash: '',
      };
      return;
    }

    if (library.length === 0 || splits.length === 0 || !isDraftLoaded) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const splitData = getSplitForDate(date, manualSplit);
    if (!splitData) return;
    const { currentSplit, sanitizedSplit } = splitData;

    // Create a simple hash of the split data to detect changes
    const splitDataHash = JSON.stringify({
      name: sanitizedSplit.name,
      running: sanitizedSplit.running,
      exercises: sanitizedSplit.exercises
    });

    const isDateChanged = dateStr !== lastLoadedRef.current.date;
    const isSplitSelectionChanged = manualSplit !== lastLoadedRef.current.split;
    const isSplitDataChanged = splitDataHash !== lastLoadedRef.current.splitDataHash;
    const isWorkoutEmpty = !workoutMeta.workoutName && liftExercises.length === 0;

    // Only auto-load if:
    // 1. Date or split selection changed
    // 2. The workout is currently empty
    // 3. The split data itself changed AND the workout is still "clean" (matches the old split data)
    if (isDateChanged || isSplitSelectionChanged || isWorkoutEmpty || (isSplitDataChanged && isWorkoutEmpty)) {
      loadProgrammedWorkout(date, manualSplit);
      lastLoadedRef.current = { 
        date: dateStr, 
        split: manualSplit,
        splitDataHash: splitDataHash
      };
    }
  }, [date, library, splits, manualSplit, workoutMeta.workoutName, liftExercises.length, isDraftLoaded, loadProgrammedWorkout, getSplitForDate]);

  const addExercise = () => {
    runWithUndo(() => {
      const newEx: ExerciseEntry = {
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        muscleGroup: 'Other',
        trackingMode: 'reps',
        sets: 0,
        reps: 0,
        distance: 0,
        time: 0,
        timeUnit: 'min',
        weight: 0,
        rpe: null,
        rir: null,
        notes: '',
      };
      setBlocks(prev => {
        const liftIdx = prev.findIndex(b => b.kind === 'lift');
        if (liftIdx === -1) {
          const newLiftBlock: LiftBlock = {
            id: `lift_${Math.random().toString(36).substr(2, 9)}`,
            kind: 'lift',
            exercises: [newEx],
          };
          return [newLiftBlock, ...prev];
        }
        return prev.map((b, i) =>
          i === liftIdx
            ? { ...(b as LiftBlock), exercises: [...(b as LiftBlock).exercises, newEx] }
            : b
        );
      });
    });
  };

  const addLiftBlock = () => addExercise();

  const addCardioBlock = () => {
    runWithUndo(() => {
      const newBlock: CardioBlock = {
        id: `cardio_${Math.random().toString(36).substr(2, 9)}`,
        kind: 'cardio',
        placement: 'after',
        programmedName: '',
      };
      setBlocks(prev => [...prev, newBlock]);
    });
  };

  const addHiitBlock = () => {
    runWithUndo(() => {
      const newBlock: HiitBlock = {
        id: `hiit_${Math.random().toString(36).substr(2, 9)}`,
        kind: 'hiit',
        placement: 'after',
        programmedName: '',
      };
      setBlocks(prev => [...prev, newBlock]);
    });
  };

  const updateExercise = (id: string, updates: Partial<ExerciseEntry>) => {
    runWithUndo(() => {
      setBlocks(prev => prev.map(b =>
        b.kind === 'lift'
          ? { ...b, exercises: b.exercises.map(ex => ex.id === id ? { ...ex, ...updates } : ex) }
          : b
      ));
    });
  };

  const updateSuperset = (id: string, superset: Partial<ExerciseEntry> | null) => {
    runWithUndo(() => {
      setBlocks(prev =>
        prev.map(block =>
          block.kind === 'lift'
            ? {
                ...block,
                exercises: block.exercises.map(ex =>
                  ex.id === id ? { ...ex, superset: (superset as ExerciseEntry | null) || null } : ex
                ),
              }
            : block
        )
      );
    });
  };

  const removeExercise = (id: string) => {
    runWithUndo(() => {
      setBlocks(prev => prev.map(b =>
        b.kind === 'lift'
          ? { ...b, exercises: b.exercises.filter(ex => ex.id !== id) }
          : b
      ));
    });
  };

  const updateHiitExercise = (blockId: string, exerciseId: string, updates: Partial<ExerciseEntry>) => {
    runWithUndo(() => {
      setBlocks(prev => prev.map(b => {
        if (b.id !== blockId || b.kind !== 'hiit') return b;
        return {
          ...b,
          exercises: (b.exercises || []).map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex)
        };
      }));
    });
  };

  const removeHiitExercise = (blockId: string, exerciseId: string) => {
    runWithUndo(() => {
      setBlocks(prev => prev.map(b => {
        if (b.id !== blockId || b.kind !== 'hiit') return b;
        return {
          ...b,
          exercises: (b.exercises || []).filter(ex => ex.id !== exerciseId)
        };
      }));
    });
  };

  const addHiitExercise = (blockId: string) => {
    runWithUndo(() => {
      const newEx: ExerciseEntry = {
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        muscleGroup: 'Other',
        trackingMode: 'reps',
        sets: 0,
        reps: 0,
        distance: 0,
        time: 0,
        timeUnit: 'min',
        weight: 0,
        rpe: null,
        rir: null,
        notes: '',
      };
      setBlocks(prev => prev.map(b => {
        if (b.id !== blockId || b.kind !== 'hiit') return b;
        return {
          ...b,
          exercises: [...(b.exercises || []), newEx]
        };
      }));
    });
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const handleSave = async () => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      // Sanitize and normalize workout data before saving
      const { exercises, conditioning } = projectBlocksToLegacy(blocks);

      // Safety check: if the date has changed from the originally loaded historical workout,
      // we must generate a new ID to prevent overwriting the old record.
      let finalId = workoutMeta.id;
      if (workoutMeta.isHistorical && workoutMeta.date) {
        const originalDateStr = format(new Date(workoutMeta.date), 'yyyy-MM-dd');
        const currentDateStr = format(date, 'yyyy-MM-dd');
        if (originalDateStr !== currentDateStr) {
          finalId = undefined; // Force a new ID
        }
      }

      const workoutToSave = sanitizeData({
        ...workoutMeta,
        exercises,
        conditioning,
        blocks: blocks.length > 0 ? blocks : undefined,
        id: finalId || Math.random().toString(36).substr(2, 9),
        date: date.toISOString(),
        timestamp: Date.now(),
        uid: user.uid,
      });
      
      await storage.saveWorkout(workoutToSave as Workout, user.uid);
      await storage.clearDraft(user.uid);
      
      // Update local state to reflect the new saved identity
      setWorkoutMeta(prev => ({
        ...prev,
        id: workoutToSave.id,
        date: workoutToSave.date,
        isHistorical: true,
        postWorkoutEnergy: 5
      }));
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save workout:', error);
      // Don't immediately reset so user can see it failed or use recovery button
      // But we should probably allow them to try again
      setSaveStatus('idle');
    }
  };

  const handleClearSplit = () => {
    runWithUndo(() => {
      setWorkoutMeta(prev => ({
        ...prev,
        workoutName: '',
        workoutSummary: '',
        runningStats: '',
        notes: '',
        postWorkoutEnergy: 5,
      }));
      setBlocks([]);
      setManualSplit(NO_SPLIT_SENTINEL);
      setExpandedSupersets({});
    });
  };

  const reloadWorkoutForDate = useCallback((targetDate: Date) => {
    runWithUndo(() => {
      setManualSplit(null);
      loadProgrammedWorkout(targetDate, null);
      setWorkoutMeta(prev => ({ ...prev, id: Math.random().toString(36).substr(2, 9) }));
    });
  }, [loadProgrammedWorkout]);

  const handleReset = () => {
    reloadWorkoutForDate(date);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Check if we are dropping into a superset
    if (over.id.toString().startsWith('superset-drop-')) {
      const parentId = over.id.toString().replace('superset-drop-', '');
      runWithUndo(() => {
        setBlocks(prev => prev.map(b => {
          if (b.kind !== 'lift') return b;
          
          // Find the exercise being dragged
          const activeExercise = b.exercises.find(ex => ex.id === active.id);
          if (!activeExercise) return b;

          // Remove from current position
          const newExercises = b.exercises.filter(ex => ex.id !== active.id);
          
          // Add to superset
          return {
            ...b,
            exercises: newExercises.map(ex => {
              if (ex.id === parentId) {
                return { ...ex, superset: activeExercise };
              }
              return ex;
            })
          };
        }));
      });
      return;
    }

    runWithUndo(() => {
      setBlocks(prev => {
        // Check if we are dragging a block
        const activeBlockIndex = prev.findIndex(b => b.id === active.id);
        const overBlockIndex = prev.findIndex(b => b.id === over.id);

        if (activeBlockIndex !== -1 && overBlockIndex !== -1) {
          // Block-level reorder
          return arrayMove(prev, activeBlockIndex, overBlockIndex);
        }

        // Otherwise, it might be an exercise-level reorder inside the lift block
        return prev.map(b => {
          if (b.kind !== 'lift') return b;
          const oldIndex = b.exercises.findIndex(ex => ex.id === active.id);
          const newIndex = b.exercises.findIndex(ex => ex.id === over.id);
          if (oldIndex === -1 || newIndex === -1) return b;
          return { ...b, exercises: arrayMove(b.exercises, oldIndex, newIndex) };
        });
      });
    });
  };

  const changeDate = (days: number) => {
    runWithUndo(() => {
      setDate(prev => addDays(prev, days));
      setManualSplit(null); // Reset manual split when date changes
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Daily Log</h2>
          <p className="text-muted-foreground">{format(date, 'EEEE, MMMM do, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-card border border-border rounded-md p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground"
              onClick={() => changeDate(-1)}
            >
              <ChevronLeft size={18} />
            </Button>
            <Input 
              type="date" 
              value={format(date, 'yyyy-MM-dd')}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;

                const [year, month, day] = value.split('-').map(Number);

                runWithUndo(() => {
                  setDate(new Date(year, month - 1, day));
                  setManualSplit(null);
                  setWorkoutMeta(prev => ({ ...prev, postWorkoutEnergy: 5, notes: '' }));
                });
              }}
              className="w-auto border-none focus-visible:ring-0 h-8 text-sm text-foreground"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground"
              onClick={() => changeDate(1)}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSaveStatus('idle')}
                className="text-[10px] h-8 border-border text-muted-foreground hover:bg-muted"
              >
                Reset Save
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={saveStatus === 'saving'}
              className={cn(
                "text-white transition-all",
                saveStatus === 'success' ? "bg-green-600 hover:bg-green-700" : "bg-maroon hover:bg-maroon-light"
              )}
            >
              {saveStatus === 'saving' ? (
                <>Saving...</>
              ) : saveStatus === 'success' ? (
                <><Check size={18} className="mr-2" /> Saved!</>
              ) : (
                <><Save size={18} className="mr-2" /> Save Workout</>
              )}
            </Button>
          </div>
        </div>
      </header>
      {workoutMeta.isHistorical && (
        <div className="bg-maroon/10 border border-maroon/20 text-maroon p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={20} className="shrink-0" />
            <span className="font-semibold text-sm">
              Editing saved workout from {format(new Date(workoutMeta.date || date), 'MMMM d, yyyy')}. Changes will update that saved log unless you switch dates or create a new entry.
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => {
            setWorkoutMeta(prev => ({ ...prev, isHistorical: false }));
            storage.clearDraft(user?.uid || '');
          }}>Exit Edit</Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          {/* Workout Header Card */}
          <Card className="border-border shadow-sm overflow-hidden">
            <div className="h-2 bg-maroon" />
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  {/* Workout Name */}
                  <div className="flex-1 space-y-1">
                    <Label className="label-micro">Workout Name</Label>
                    <Input 
                      value={workoutMeta.workoutName} 
                      onChange={e => {
                        beginUndoableEdit();
                        setWorkoutMeta(prev => ({ ...prev, workoutName: e.target.value }));
                      }}
                      className="h-9 text-base font-semibold"
                      placeholder="Enter workout name..."
                    />
                  </div>

                  {/* Change Program */}
                  <div className="w-full md:w-48 space-y-1">
                    <Label className="label-micro">Program</Label>
                    <Select 
                      value={manualSplit ?? ""} 
                      onValueChange={(val) => {
                        captureSnapshot();
                        setManualSplit(val);
                        if (val === NO_SPLIT_SENTINEL) {
                          setWorkoutMeta(prev => ({
                            ...prev,
                            workoutName: '',
                            workoutSummary: '',
                            runningStats: '',
                            notes: '',
                          }));
                          setBlocks([]);
                        }
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <span className="text-sm">Change Workout</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_SPLIT_SENTINEL}>No Program</SelectItem>
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                          const split = splits.find(s => s.day === day);
                          return (
                            <SelectItem key={day} value={split?.name || day}>
                              {day} | {split?.name || '—'}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action row: Reset / Clear Program / Undo */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Dialog>
                    <DialogTrigger 
                      render={
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs border-border text-muted-foreground hover:text-maroon hover:border-maroon/50"
                        >
                          Reset Workout
                        </Button>
                      }
                    />
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset this workout?</DialogTitle>
                        <DialogDescription>
                          This will discard your current in-progress changes and rebuild the workout from the programmed split for this day.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose render={<Button variant="outline">Cancel</Button>} />
                        <DialogClose render={<Button onClick={handleReset} className="bg-maroon hover:bg-maroon-light text-white">Reset Workout</Button>} />
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger 
                      render={
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs border-border text-muted-foreground hover:text-maroon hover:border-maroon/50"
                        >
                          Clear Exercises
                        </Button>
                      }
                    />
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Clear this workout?</DialogTitle>
                        <DialogDescription>
                          This will remove the current workout blocks and notes for this log. You can still use Undo right after.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose render={<Button variant="outline">Cancel</Button>} />
                        <DialogClose render={<Button onClick={handleClearSplit} className="bg-maroon hover:bg-maroon-light text-white">Clear Workout</Button>} />
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {previousSnapshot && (
                    <div className="flex items-center gap-2 ml-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleUndo}
                        className="h-8 text-xs border-maroon/30 text-maroon hover:bg-maroon/5"
                      >
                        Undo
                      </Button>
                      <span className="text-xs text-muted-foreground italic">Undo is available for your last reset/clear action.</span>
                    </div>
                  )}
                </div>

                {/* Workout Summary Snapshot (Read-Only) */}
                {(() => {
                  const currentSplit = splits.find(s => s.name === (manualSplit || workoutMeta.workoutName));
                  if (!currentSplit) return null;
                  
                  return (
                    <div className="p-4 bg-muted rounded-lg border border-border space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <LayoutGrid size={12} className="text-maroon" />
                        Session Snapshot (Programmed)
                      </div>
                      
                      <div className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground font-mono">
                        {currentSplit?.summary?.trim() || (currentSplit ? generateWorkoutSnapshot(currentSplit) : '')}
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-2">
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Exercises List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Exercises</h3>
            </div>

            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={blocks.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {blocks.map(block => {
                    if (block.kind === 'lift') {
                      return (
                        <SortableLiftBlock 
                          key={block.id}
                          block={block}
                          library={library}
                          updateExercise={updateExercise}
                          removeExercise={removeExercise}
                          toggleNotes={toggleNotes}
                          expandedNotes={expandedNotes}
                          updateSuperset={updateSuperset}
                          expandedSupersets={expandedSupersets}
                          setExpandedSupersets={setExpandedSupersets}
                        />
                      );
                    } else {
                      return (
                        <SortableConditioningBlock
                          key={block.id}
                          block={block}
                          library={library}
                          updateHiitExercise={updateHiitExercise}
                          removeHiitExercise={removeHiitExercise}
                          addHiitExercise={addHiitExercise}
                          onChange={(updates) => {
                            runWithUndo(() => {
                              setBlocks(prev => prev.map(b =>
                                b.id === block.id ? ({ ...b, ...updates } as Block) : b
                              ));
                            });
                          }}
                          onDelete={() => {
                            runWithUndo(() => {
                              setBlocks(prev => prev.filter(b => b.id !== block.id));
                            });
                          }}
                        />
                      );
                    }
                  })}
                </div>
              </SortableContext>
            </DndContext>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <Button variant="outline" onClick={addLiftBlock} className="border-dashed border-border">
                <Plus size={16} className="mr-1" /> Add Lift
              </Button>
              <Button variant="outline" onClick={addCardioBlock} className="border-dashed border-border">
                <Plus size={16} className="mr-1" /> Add Cardio
              </Button>
              <Button variant="outline" onClick={addHiitBlock} className="border-dashed border-border">
                <Plus size={16} className="mr-1" /> Add HIIT
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Post-Workout Energy */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Post-Workout Energy</CardTitle>
              <CardDescription>How do you feel right now?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-4xl font-bold metric-display text-primary">{workoutMeta.postWorkoutEnergy}</span>
                <span className="text-xs text-muted-foreground uppercase font-bold">Scale 1-10</span>
              </div>
              <Slider 
                value={workoutMeta.postWorkoutEnergy ? (workoutMeta.postWorkoutEnergy - 1) * (10 / 9) : 4.44} 
                min={0} 
                max={10} 
                step={0.1}
                onValueChange={(val) => {
                  beginUndoableEdit();
                  const sliderVal = typeof val === 'number' ? val : (Array.isArray(val) ? val[0] : 4.44);
                  const energy = Math.round(sliderVal * (9 / 10) + 1);
                  setWorkoutMeta(prev => ({ ...prev, postWorkoutEnergy: Math.max(1, Math.min(10, energy)) }));
                }}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                <span>Drained</span>
                <span>Average</span>
                <span>Elite</span>
              </div>
            </CardContent>
          </Card>

          {/* General Notes */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">General Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={workoutMeta.notes}
                onChange={e => {
                  beginUndoableEdit();
                  setWorkoutMeta(prev => ({ ...prev, notes: e.target.value }));
                }}
                placeholder="Overall feeling, sleep, nutrition, etc..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
