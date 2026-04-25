/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Info,
  Plus,
  Trash2,
  Save,
  GripVertical,
  Check,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseSelector } from "@/src/components/ExerciseSelector";
import { useFirebase } from "@/src/components/FirebaseProvider";
import { storage } from "@/src/services/storage";
import {
  Split as SplitType,
  ExerciseLibraryEntry,
  SavedSplit,
  ProgrammedExercise,
  BlockTemplate,
} from "@/src/types";
import { SPLIT_TEMPLATES, CARDIO_SUBTYPES, HIIT_SUBTYPES } from "@/src/constants";
import { generateWorkoutSnapshot } from "@/src/lib/workoutUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  closestCenter,
  rectIntersection,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  CollisionDetection,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const genId = () =>
  `ex_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const AutoGrowTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, value, onChange, ...props }, ref) => {
  const localRef = React.useRef<HTMLTextAreaElement>(null);
  const resolvedRef = (ref as any) || localRef;

  React.useEffect(() => {
    const el = resolvedRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <Textarea
      ref={resolvedRef}
      value={value}
      onChange={onChange}
      className={cn("resize-y", className)}
      {...props}
    />
  );
});
AutoGrowTextarea.displayName = "AutoGrowTextarea";

interface SortableExerciseBadgeProps {
  exercise: string | ProgrammedExercise;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ProgrammedExercise>) => void;
  onAddSuperset: (parentId: string) => void;
  onRemoveSuperset: (parentId: string, childId: string) => void;
  onEjectFromSuperset?: (childId: string) => void;
  onEjectChildFromParent?: (parentId: string, childId: string) => void;
  isParent?: boolean;
  library: ExerciseLibraryEntry[];
  depth?: number;
}

const SortableExerciseBadge = React.memo(
  ({
    exercise,
    onRemove,
    onUpdate,
    onAddSuperset,
    onRemoveSuperset,
    onEjectFromSuperset,
    onEjectChildFromParent,
    isParent = true,
    library,
    depth = 0,
  }: SortableExerciseBadgeProps) => {
    const isProgrammed = typeof exercise !== "string";
    const id = isProgrammed ? exercise.id || exercise.name : exercise;
    const name = isProgrammed ? exercise.name : exercise;

    const [notesOpen, setNotesOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
      id: `drop_${id}`,
      data: { type: 'parent-drop', parentId: id },
      disabled: !isParent,
    });

    const combinedRef = (el: HTMLElement | null) => {
      setNodeRef(el);
      if (isParent) setDropNodeRef(el);
    };

    const style = transform
      ? {
          transform: CSS.Transform.toString(transform),
          transition,
          zIndex: isDragging ? 10 : 1,
          opacity: isDragging ? 0.5 : 1,
        }
      : undefined;

    const sets = isProgrammed ? exercise.sets || "" : "";
    const reps = isProgrammed ? exercise.reps || "" : "";
    const targetNotes = isProgrammed ? exercise.targetNotes || "" : "";

    return (
      <div
        ref={combinedRef}
        style={style}
        className={cn(
          "bg-card border border-border rounded-md shadow-sm group transition-all space-y-2",
          depth === 0 ? "p-3" : "p-2 ml-4 border-l-4 border-l-maroon/30",
          isOver && isParent && "ring-2 ring-maroon/60 ring-offset-2 bg-maroon/5"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isParent && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
              >
                <GripVertical size={16} />
              </div>
            )}
            {isProgrammed && !name ? (
              <div className="flex-1">
                <button
                  onClick={() => setPickerOpen(true)}
                  className="text-sm font-medium text-muted-foreground border-b border-dashed border-muted-foreground hover:text-foreground transition-colors"
                >
                  Select Exercise...
                </button>
                <ExerciseSelector
                  open={pickerOpen}
                  onOpenChange={setPickerOpen}
                  exercises={library}
                  value=""
                  onSelect={(entry) => {
                    onUpdate(id, { name: entry.name });
                    setPickerOpen(false);
                  }}
                  hideTrigger
                />
              </div>
            ) : (
              <button
                onClick={() => setPickerOpen(true)}
                className="font-medium text-foreground truncate hover:text-maroon transition-colors text-left"
              >
                {name}
              </button>
            )}
            {isProgrammed && name && (
              <ExerciseSelector
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                exercises={library}
                value=""
                onSelect={(entry) => {
                  onUpdate(id, { name: entry.name });
                  setPickerOpen(false);
                }}
                hideTrigger
              />
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isParent) onAddSuperset(id);
                else if (onEjectFromSuperset) onEjectFromSuperset(id);
              }}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded border text-[10px] font-bold transition-colors",
                isParent
                  ? "border-maroon/30 text-maroon hover:bg-maroon/10"
                  : "border-gold/40 text-gold hover:bg-gold/10"
              )}
              title={isParent ? "Add superset" : "Eject from superset"}
            >
              SS
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(id);
              }}
              className="text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Programmed sets/reps row — always editable when exercise is programmed */}
        <div
          className="pl-7 flex items-center gap-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 flex-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider w-10">
              Sets
            </Label>
            <Input
              value={sets}
              onChange={(e) => onUpdate(id, { sets: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1 flex-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider w-10">
              Reps
            </Label>
            <Input
              value={reps}
              onChange={(e) => onUpdate(id, { reps: e.target.value })}
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
                : "text-muted-foreground border-border hover:border-maroon/40",
            )}
            title={targetNotes ? "Edit snapshot notes" : "Add snapshot notes"}
          >
            {targetNotes ? "Note" : "+ Note"}
          </button>
        </div>

        {/* Optional snapshot notes textarea */}
        {notesOpen && (
          <div className="pl-7" onPointerDown={(e) => e.stopPropagation()}>
            <AutoGrowTextarea
              value={targetNotes}
              onChange={(e) => onUpdate(id, { targetNotes: e.target.value })}
              placeholder="Snapshot notes for this exercise (e.g. 'Main lift — high intent', '155 was sweet spot')..."
              className="text-xs w-full"
            />
          </div>
        )}

        {/* RECURSIVE SUPERSET DRAG AND DROP */}
        {isProgrammed && exercise.superset && exercise.superset.length > 0 && (
           <div className="mt-3 space-y-2 border-l-2 border-dashed border-border pl-2">
             <SortableContext
               items={exercise.superset.map((ex) => ex.id || ex.name)}
               strategy={verticalListSortingStrategy}
             >
               {exercise.superset.map((subEx) => (
                 <SortableExerciseBadge
                   key={subEx.id || subEx.name}
                   exercise={subEx}
                   library={library}
                   onRemove={(childId) => onRemoveSuperset(id, childId)}
                   onUpdate={(childId, updates) =>
                     onUpdate(id, {
                       superset: exercise.superset!.map((s) =>
                         (s.id || s.name) === childId ? { ...s, ...updates } : s,
                       ),
                     })
                   }
                   onAddSuperset={() => {}}
                   onRemoveSuperset={() => {}}
                   onEjectFromSuperset={(childId) => onEjectChildFromParent?.(id, childId)}
                   onEjectChildFromParent={() => {}}
                   isParent={false}
                   depth={depth + 1}
                 />
               ))}
             </SortableContext>
           </div>
        )}
      </div>
    );
  },
);

const dropZoneFirstCollision: CollisionDetection = (args) => {
  // First pass: only consider droppable containers whose id starts with "drop_"
  const dropZoneContainers = args.droppableContainers.filter(c =>
    String(c.id).startsWith('drop_')
  );
  const dropZoneCollisions = pointerWithin({
    ...args,
    droppableContainers: dropZoneContainers,
  });
  if (dropZoneCollisions.length > 0) {
    // Exclude collisions where the drop zone corresponds to the dragged item itself
    const activeId = args.active?.id != null ? String(args.active.id) : '';
    const filtered = dropZoneCollisions.filter(c => {
      const targetId = String(c.id).slice('drop_'.length);
      return targetId !== activeId;
    });
    if (filtered.length > 0) return filtered;
  }
  // Fallback: standard sortable collision via closestCenter on non-drop-zone items
  const sortableContainers = args.droppableContainers.filter(c =>
    !String(c.id).startsWith('drop_')
  );
  return closestCenter({
    ...args,
    droppableContainers: sortableContainers,
  });
};

export default function Split() {
  const { user } = useFirebase();
  const [splits, setSplits] = useState<SplitType[]>([]);
  const [library, setLibrary] = useState<ExerciseLibraryEntry[]>([]);
  const [savingIds, setSavingIds] = useState<
    Record<string, "saving" | "saved" | "error" | null>
  >({});
  const [isSelecting, setIsSelecting] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [saveAllSuccess, setSaveAllSuccess] = useState(false);
  const [savedSplits, setSavedSplits] = useState<SavedSplit[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newSplitName, setNewSplitName] = useState("");
  const [stagedSplitDays, setStagedSplitDays] = useState<Record<
    string,
    any
  > | null>(null);
  const [hasAssignedSplit, setHasAssignedSplit] = useState(false);
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!user) return;

    const unsubscribeSplits = storage.subscribeToSplits(user.uid, (data) => {
      if (data.length === 0) {
        setSplits([]);
        setHasAssignedSplit(false);
      } else {
        const backfillExercises = (
          exs: (string | ProgrammedExercise)[],
        ): ProgrammedExercise[] => {
          return exs.map((ex) => {
            if (typeof ex === "string") {
              return {
                id: genId(),
                name: ex,
                sets: "",
                reps: "",
                targetNotes: "",
              };
            }
            return {
              ...ex,
              id: ex.id || genId(),
              superset: ex.superset
                ? backfillExercises(ex.superset)
                : undefined,
            };
          });
        };

        const uniqueSplits = data.map((s) => ({
          ...s,
          exercises: backfillExercises(s.exercises || []),
          blocks: s.blocks || [],
        }));
        const sorted = uniqueSplits.sort(
          (a, b) => days.indexOf(a.day) - days.indexOf(b.day),
        );

        const hasRealAssignedSplit = sorted.some(
          (s) =>
            (s.name && s.name.trim() !== "") ||
            (s.exercises && s.exercises.length > 0),
        );
        setHasAssignedSplit(hasRealAssignedSplit);

        setSplits(sorted);
      }
    });

    const unsubscribeLibrary = storage.subscribeToLibrary(user.uid, (data) => {
      setLibrary(data);
    });

    const unsubscribeSavedSplits = storage.subscribeToSavedSplits(
      user.uid,
      (data) => {
        const backfillExercises = (
          exs: (string | ProgrammedExercise)[],
        ): ProgrammedExercise[] => {
          return exs.map((ex) => {
            if (typeof ex === "string") {
              return {
                id: genId(),
                name: ex,
                sets: "",
                reps: "",
                targetNotes: "",
              };
            }
            return {
              ...ex,
              id: ex.id || genId(),
              superset: ex.superset
                ? backfillExercises(ex.superset)
                : undefined,
            };
          });
        };

        const updatedSavedSplits = data.map((saved) => {
          const updatedDays: Record<string, any> = {};
          Object.entries(saved.days).forEach(([day, data]) => {
            updatedDays[day] = {
              ...data,
              name: data.name,
              exercises: backfillExercises(data.exercises || []),
              blocks: data.blocks || [],
            };
          });
          return { ...saved, days: updatedDays };
        });
        setSavedSplits(updatedSavedSplits);
      },
    );

    return () => {
      unsubscribeSplits();
      unsubscribeLibrary();
      unsubscribeSavedSplits();
    };
  }, [user]);

  const updateSplit = (id: string, updates: Partial<SplitType>) => {
    setSplits((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const next = { ...s, ...updates };
          return next;
        }
        return s;
      }),
    );
  };

  const saveSplit = async (split: SplitType) => {
    if (!user) return;
    setSavingIds((prev) => ({ ...prev, [split.id]: "saving" }));
    try {
      await storage.saveSplit(split, user.uid);
      setSavingIds((prev) => ({ ...prev, [split.id]: "saved" }));
      setTimeout(() => {
        setSavingIds((prev) => ({ ...prev, [split.id]: null }));
      }, 1800);
    } catch (error) {
      console.error("Failed to save split:", error);
      setSavingIds((prev) => ({ ...prev, [split.id]: "error" }));
      setTimeout(() => {
        setSavingIds((prev) => ({ ...prev, [split.id]: null }));
      }, 2000);
    }
  };

  const updateProgrammedExercise = (
    splitId: string,
    exerciseId: string,
    updates: Partial<ProgrammedExercise>,
  ) => {
    const updateRecursive = (
      exs: (string | ProgrammedExercise)[],
    ): (string | ProgrammedExercise)[] => {
      return exs.map((item) => {
        if (typeof item === "string") return item;
        if ((item.id || item.name) === exerciseId)
          return { ...item, ...updates } as ProgrammedExercise;
        if (item.superset)
          return {
            ...item,
            superset: updateRecursive(item.superset) as ProgrammedExercise[],
          } as ProgrammedExercise;
        return item;
      });
    };
    setSplits((prev) =>
      prev.map((s) =>
        s.id === splitId
          ? { ...s, exercises: updateRecursive(s.exercises) }
          : s,
      ),
    );
  };

  const addExerciseToSplit = (splitId: string) => {
    const newEx: ProgrammedExercise = {
      id: genId(),
      name: "",
      sets: "",
      reps: "",
      targetNotes: "",
    };
    setSplits((prev) =>
      prev.map((s) =>
        s.id === splitId ? { ...s, exercises: [...s.exercises, newEx] } : s,
      ),
    );
  };

  const removeBlock = (splitId: string, blockId: string) => {
    setSplits((prev) =>
      prev.map((s) =>
        s.id === splitId
          ? { ...s, blocks: (s.blocks || []).filter((b) => b.id !== blockId) }
          : s,
      ),
    );
  };

  const addCardioToSplit = (splitId: string) => {
    const newBlock: BlockTemplate = {
      id: genId(),
      kind: "cardio",
      cardioName: "New Cardio Block",
    };
    setSplits((prev) =>
      prev.map((s) =>
        s.id === splitId
          ? { ...s, blocks: [...(s.blocks || []), newBlock] }
          : s,
      ),
    );
  };

  const updateBlock = (
    splitId: string,
    blockId: string,
    updates: Partial<BlockTemplate>,
  ) => {
    setSplits((prev) =>
      prev.map((s) => {
        if (s.id !== splitId) return s;
        return {
          ...s,
          blocks: (s.blocks || []).map((b) =>
            b.id === blockId ? { ...b, ...updates } : b,
          ),
        };
      }),
    );
  };

  const addHiitToSplit = (splitId: string) => {
    const newBlock: BlockTemplate = {
      id: genId(),
      kind: "hiit",
      hiitName: "New HIIT Block",
    };
    setSplits((prev) =>
      prev.map((s) =>
        s.id === splitId
          ? { ...s, blocks: [...(s.blocks || []), newBlock] }
          : s,
      ),
    );
  };

  const removeExerciseFromSplit = (splitId: string, exerciseId: string) => {
    const split = splits.find((s) => s.id === splitId);
    if (split) {
      updateSplit(splitId, {
        exercises: split.exercises.filter((ex) => {
          if (typeof ex === "string") return ex !== exerciseId;
          return (ex.id || ex.name) !== exerciseId;
        }),
      });
    }
  };

  const addSupersetToExercise = (splitId: string, parentId: string) => {
    const addRecursive = (
      exs: (string | ProgrammedExercise)[],
    ): (string | ProgrammedExercise)[] => {
      return exs.map((item) => {
        if (typeof item === "string") return item;
        if ((item.id || item.name) === parentId) {
          return {
            ...item,
            superset: [
              ...(item.superset || []),
              { id: genId(), name: "", sets: "", reps: "", targetNotes: "" },
            ],
          } as ProgrammedExercise;
        }
        if (item.superset)
          return {
            ...item,
            superset: addRecursive(item.superset) as ProgrammedExercise[],
          } as ProgrammedExercise;
        return item;
      });
    };
    setSplits((prev) =>
      prev.map((s) =>
        s.id === splitId ? { ...s, exercises: addRecursive(s.exercises) } : s,
      ),
    );
  };

  const removeSupersetChild = (
    splitId: string,
    parentId: string,
    childId: string,
  ) => {
    const removeRecursive = (
      exs: (string | ProgrammedExercise)[],
    ): (string | ProgrammedExercise)[] => {
      return exs.map((item) => {
        if (typeof item === "string") return item;
        if ((item.id || item.name) === parentId && item.superset) {
          return {
            ...item,
            superset: item.superset.filter((s) => (s.id || s.name) !== childId),
          } as ProgrammedExercise;
        }
        if (item.superset)
          return {
            ...item,
            superset: removeRecursive(item.superset) as ProgrammedExercise[],
          } as ProgrammedExercise;
        return item;
      });
    };
    setSplits((prev) =>
      prev.map((s) =>
        s.id === splitId
          ? { ...s, exercises: removeRecursive(s.exercises) }
          : s,
      ),
    );
  };

  const ejectChildFromSuperset = (
    splitId: string,
    parentId: string,
    childId: string,
  ) => {
    setSplits((prev) =>
      prev.map((s) => {
        if (s.id !== splitId) return s;
        let ejected: ProgrammedExercise | null = null;
        const next = s.exercises.map((item) => {
          if (typeof item === 'string') return item;
          if ((item.id || item.name) !== parentId) return item;
          if (!item.superset) return item;
          const foundIdx = item.superset.findIndex(
            c => (c.id || c.name) === childId,
          );
          if (foundIdx === -1) return item;
          ejected = item.superset[foundIdx];
          const remaining = item.superset.filter((_, i) => i !== foundIdx);
          return {
            ...item,
            superset: remaining.length > 0 ? remaining : undefined,
          } as ProgrammedExercise;
        });
        if (!ejected) return s;
        return { ...s, exercises: [...next, ejected as ProgrammedExercise] };
      }),
    );
  };

  const stageTemplateSplit = (templateDays?: any) => {
    if (!user || !templateDays) return;

    const staged: SplitType[] = days.map((day) => {
      const data = templateDays[day] || {
        name: "",
        running: "",
        exercises: [],
        summary: "",
      };
      return {
        id: `${user.uid}_${day}`,
        day,
        name: data.name || "",
        running: data.running || "",
        exercises: data.exercises || [],
        blocks: data.blocks || [],
        summary: data.summary || "",
        uid: user.uid,
      };
    });

    setSplits(staged);
    setStagedSplitDays(templateDays);
    setIsSelecting(false);
  };

  const stageSavedSplit = (savedSplit: SavedSplit) => {
    if (!user) return;

    const staged: SplitType[] = days.map((day) => {
      const data = savedSplit.days[day] || {
        name: "",
        running: "",
        exercises: [],
        summary: "",
      };
      return {
        id: `${user.uid}_${day}`,
        day,
        name: data.name || "",
        running: data.running || "",
        exercises: data.exercises || [],
        blocks: data.blocks || [],
        summary: data.summary || "",
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
    const staged: SplitType[] = days.map((day) => {
      emptyDays[day] = { name: "", running: "", exercises: [], summary: "" };
      return {
        id: `${user.uid}_${day}`,
        day,
        name: "",
        running: "",
        exercises: [],
        blocks: [],
        summary: "",
        uid: user.uid,
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
      const daysData: Record<
        string,
        {
          name: string;
          running: string;
          exercises: any[];
          blocks?: BlockTemplate[];
          summary?: string;
        }
      > = {};
      splits.forEach((s) => {
        daysData[s.day] = {
          name: s.name,
          running: s.running,
          exercises: s.exercises,
          blocks: s.blocks || [],
          summary: s.summary,
        };
      });

      const savedSplit: SavedSplit = {
        id: Math.random().toString(36).substr(2, 9),
        name: newSplitName.trim(),
        days: daysData,
        uid: user.uid,
        timestamp: Date.now(),
      };

      await storage.saveSavedSplit(savedSplit, user.uid);

      setSaveAllSuccess(true);
      setIsSaveDialogOpen(false);
      setNewSplitName("");
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
    days.forEach((day) => {
      emptyDays[day] = {
        name: "",
        running: "",
        exercises: [],
        blocks: [],
        summary: "",
      };
    });

    await storage.seedSplits(user.uid, emptyDays);

    if (user.uid.startsWith("guest_")) {
      const saved = sessionStorage.getItem("guest_splits");
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
    splits.forEach((split) => {
      daysData[split.day] = {
        name: split.name,
        running: split.running,
        exercises: split.exercises,
        blocks: split.blocks || [],
        summary: split.summary || "",
      };
    });

    await storage.seedSplits(user.uid, daysData);

    if (user.uid.startsWith("guest_")) {
      const saved = sessionStorage.getItem("guest_splits");
      if (saved) setSplits(JSON.parse(saved));
    }

    setStagedSplitDays(null);
    setHasAssignedSplit(true);
    setIsSelecting(false);
  };

  const showSelector = (!hasAssignedSplit && !stagedSplitDays) || isSelecting;

  if (showSelector) {
    return (
      <div className="page-shell">
        <header className="page-header items-start">
          <div>
            <h2 className="page-title">
              Weekly Program
            </h2>
            <p className="page-subtitle">
              Choose a starting point for your training structure
            </p>
          </div>
        </header>

        <div className="max-w-2xl mx-auto space-y-8 pt-4 w-full">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              New Program
            </h3>
            <Card
              className="card-shell hover:border-maroon/50 cursor-pointer transition-all group"
              onClick={startFromScratch}
            >
              <CardHeader className="flex flex-row items-center gap-4 py-6">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:bg-maroon/5 group-hover:text-maroon transition-colors">
                  <Plus size={24} />
                </div>
                <div>
                  <CardTitle className="text-xl group-hover:text-maroon transition-colors">
                    Custom Program
                  </CardTitle>
                  <CardDescription>
                    Build your training week from scratch, day by day.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Preset Templates
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {SPLIT_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className="card-shell hover:border-maroon/50 cursor-pointer transition-all group"
                  onClick={() => stageTemplateSplit(template.days)}
                >
                  <CardHeader className="flex flex-row items-center gap-4 py-6">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:bg-maroon/5 group-hover:text-maroon transition-colors">
                      <LayoutGrid size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-maroon transition-colors">
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {savedSplits.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Your Saved Programs
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {savedSplits.map((saved) => (
                  <Card
                    key={saved.id}
                    className="card-shell hover:border-maroon/50 cursor-pointer transition-all group"
                    onClick={() => stageSavedSplit(saved)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:bg-maroon/5 group-hover:text-maroon transition-colors">
                          <Calendar size={24} />
                        </div>
                        <div>
                          <CardTitle className="text-xl group-hover:text-maroon transition-colors">
                            {saved.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <CardDescription>
                              {Object.values(saved.days)
                                .filter((d: any) => d.name && d.name !== "Rest")
                                .map((d: any) => d.name)
                                .join(" / ")}
                            </CardDescription>
                            {saved.isAIGenerated && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-maroon/10 text-maroon"
                              >
                                AI Generated ·{" "}
                                {saved.generatedBy === "gemini"
                                  ? "Gemini"
                                  : "AI"}
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
    <div className="page-shell">
      <header className="page-header items-start">
        <div>
          <h2 className="page-title">
            Weekly Program
          </h2>
          <p className="page-subtitle">
            Customize your hybrid training structure
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showAssignButton && (
            <Button
              onClick={assignStagedSplit}
              className="btn-primary"
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
              saveAllSuccess
                ? "bg-green-600 hover:bg-green-700"
                : "bg-maroon hover:bg-maroon-light",
            )}
          >
            {savingAll ? (
              "Saving..."
            ) : saveAllSuccess ? (
              <>
                <Check size={18} className="mr-2" /> Saved!
              </>
            ) : (
              "Save New Custom Program"
            )}
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
                onChange={(e) => setNewSplitName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
            >
              Cancel
            </Button>
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
        {splits.map((s) => {
          const splitSavedState = savingIds[s.id];
          const isDeterministic = s.id === `${user!.uid}_${s.day}`;

          return (
            <Card
              key={s.id}
              className={cn(
                "border-border shadow-md transition-all",
                !hasAssignedSplit && "opacity-60",
              )}
            >
              {/* 1. TOP SECTION: Notes/Summary (Full Width) */}
              <CardHeader className="pb-3 border-b border-border bg-card/50">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl font-extrabold text-foreground tracking-tight shrink-0">
                    {s.day}
                  </CardTitle>
                  <Input
                    value={s.name || ''}
                    onChange={(e) => updateSplit(s.id, { name: e.target.value })}
                    placeholder="Custom day name (e.g. Posterior Leg Day)"
                    className="h-8 text-sm flex-1 min-w-0"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => saveSplit(s)}
                      disabled={splitSavedState === "saving"}
                      className={cn(
                        "h-7 px-3 text-xs text-white transition-all duration-300",
                        splitSavedState === "saved"
                          ? "bg-green-600 hover:bg-green-700 scale-110 ring-2 ring-green-400/50 shadow-lg shadow-green-600/30"
                          : splitSavedState === "error"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-maroon hover:bg-maroon-light",
                      )}
                    >
                      {splitSavedState === "saving" ? (
                        "Saving..."
                      ) : splitSavedState === "saved" ? (
                        <><Check size={14} className="mr-1" /> Saved</>
                      ) : splitSavedState === "error" ? (
                        "Failed"
                      ) : (
                        <><Save size={14} className="mr-1" /> Save</>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">
                    Snapshot Notes / Summary
                  </Label>
                  <AutoGrowTextarea
                    value={s.summary || ""}
                    onChange={(e) =>
                      updateSplit(s.id, { summary: e.target.value })
                    }
                    placeholder="Focus on volume, check RPE."
                    className="text-xs w-full resize-y"
                  />
                </div>
              </CardHeader>

              {/* 2. MIDDLE SECTION: Exercises (Stretched Full Width) */}
              <CardContent className="pt-4 pb-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter w-8">
                    Lift
                  </Label>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={dropZoneFirstCollision}
                    onDragEnd={(e) => {
                      const { active, over } = e;
                      if (!over) return;

                      const activeId = String(active.id);
                      const overId = String(over.id);
                      if (activeId === overId) return;

                      // Strip "drop_" prefix if present
                      const isOverDropZone = overId.startsWith('drop_');
                      const overTargetId = isOverDropZone ? overId.slice('drop_'.length) : overId;

                      // Locate active (parent or child?) and over (parent or child?)
                      const findLocation = (id: string):
                        | { kind: 'parent'; index: number }
                        | { kind: 'child'; parentIndex: number; childIndex: number }
                        | null => {
                        const pIdx = s.exercises.findIndex(
                          ex => (typeof ex === 'string' ? ex : ex.id || ex.name) === id,
                        );
                        if (pIdx !== -1) return { kind: 'parent', index: pIdx };
                        for (let i = 0; i < s.exercises.length; i++) {
                          const ex = s.exercises[i];
                          if (typeof ex === 'string' || !ex.superset) continue;
                          const cIdx = ex.superset.findIndex(
                            c => (c.id || c.name) === id,
                          );
                          if (cIdx !== -1) return { kind: 'child', parentIndex: i, childIndex: cIdx };
                        }
                        return null;
                      };

                      const activeLoc = findLocation(activeId);
                      const overLoc = findLocation(overTargetId);
                      if (!activeLoc) return;

                      // Case 1: parent dropped INTO another parent's drop zone -> nest
                      if (isOverDropZone && activeLoc.kind === 'parent' && overLoc?.kind === 'parent'
                          && activeLoc.index !== overLoc.index) {
                        const next = [...s.exercises];
                        const draggedParent = next[activeLoc.index] as ProgrammedExercise;
                        const targetParent = next[overLoc.index] as ProgrammedExercise;

                        // Flatten: dragged parent + its children all become children of target
                        const draggedChildren = (draggedParent.superset || []);
                        const newChild: ProgrammedExercise = {
                          id: draggedParent.id || genId(),
                          name: draggedParent.name,
                          sets: draggedParent.sets || '',
                          reps: draggedParent.reps || '',
                          targetNotes: draggedParent.targetNotes || '',
                        };
                        const existingChildren = targetParent.superset || [];
                        const hasOnlyBlankPlaceholder =
                          existingChildren.length === 1 && !existingChildren[0].name;

                        // Flatten: dragged parent + its children become children of target. Replace placeholder if it's the only child.
                        const mergedChildren = hasOnlyBlankPlaceholder
                          ? [newChild, ...draggedChildren]
                          : [...existingChildren, newChild, ...draggedChildren];

                        next[overLoc.index] = { ...targetParent, superset: mergedChildren };
                        next.splice(activeLoc.index, 1);
                        updateSplit(s.id, { exercises: next });
                        return;
                      }

                      // Case 2: parent-to-parent sortable reorder
                      if (activeLoc.kind === 'parent' && overLoc?.kind === 'parent') {
                        updateSplit(s.id, {
                          exercises: arrayMove(s.exercises, activeLoc.index, overLoc.index) as
                            (string | ProgrammedExercise)[],
                        });
                        return;
                      }

                      // Case 3: child reorder within the SAME parent
                      if (activeLoc.kind === 'child' && overLoc?.kind === 'child'
                          && activeLoc.parentIndex === overLoc.parentIndex) {
                        const parent = s.exercises[activeLoc.parentIndex] as ProgrammedExercise;
                        const reordered = arrayMove(parent.superset!, activeLoc.childIndex, overLoc.childIndex);
                        const next = [...s.exercises];
                        next[activeLoc.parentIndex] = { ...parent, superset: reordered };
                        updateSplit(s.id, { exercises: next });
                        return;
                      }
                    }}
                  >
                    <SortableContext
                      items={s.exercises.flatMap((ex) => {
                        if (typeof ex === "string") return [ex];
                        const parentId = ex.id || ex.name;
                        const childIds = (ex.superset || []).map(c => c.id || c.name);
                        return [parentId, ...childIds];
                      })}
                      strategy={verticalListSortingStrategy}
                    >
                      {s.exercises.map((ex) => (
                        <SortableExerciseBadge
                          key={typeof ex === "string" ? ex : ex.id || ex.name}
                          exercise={ex}
                          library={library}
                          onRemove={(exerciseId) =>
                            removeExerciseFromSplit(s.id, exerciseId)
                          }
                          onUpdate={(exerciseId, updates) =>
                            updateProgrammedExercise(s.id, exerciseId, updates)
                          }
                          onAddSuperset={(parentId) =>
                            addSupersetToExercise(s.id, parentId)
                          }
                          onRemoveSuperset={(parentId, childId) =>
                            removeSupersetChild(s.id, parentId, childId)
                          }
                          onEjectChildFromParent={(parentId, childId) => ejectChildFromSuperset(s.id, parentId, childId)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>

                {/* *** RENDER HIIT/CARDIO BLOCKS *** */}
                {s.blocks && s.blocks.length > 0 && (
                  <div className="space-y-3 mt-6 pt-4 border-t border-border/40">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter w-8">
                      Conditioning
                    </Label>
                    <div className="space-y-2">
             {s.blocks.map((block) => (
               <div
                 key={block.id}
                 className="p-3 bg-card border border-border rounded-md shadow-sm space-y-2"
               >
                 <div className="flex items-center justify-between gap-2">
                   <div className="flex items-center gap-2 flex-1 min-w-0">
                     <span className={cn(
                       "text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0",
                       block.kind === 'hiit'
                         ? "bg-maroon/10 text-maroon"
                         : "bg-gold/20 text-gold"
                     )}>
                       {block.kind === 'hiit' ? 'HIIT' : 'Cardio'}
                     </span>
                     <Input
                       value={block.kind === 'hiit' ? (block.hiitName || '') : (block.cardioName || '')}
                       onChange={(e) => updateBlock(s.id, block.id,
                         block.kind === 'hiit'
                           ? { hiitName: e.target.value }
                           : { cardioName: e.target.value }
                       )}
                       placeholder={block.kind === 'hiit' ? 'HIIT name...' : 'Cardio name...'}
                       className="h-8 text-sm flex-1"
                     />
                   </div>
                   <button
                     onClick={() => removeBlock(s.id, block.id)}
                     className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                   >
                     <Trash2 size={16} />
                   </button>
                 </div>

                 {/* Subtype + details row */}
                 <div className="flex items-center gap-2">
                   <select
                     value={block.kind === 'hiit' ? (block.hiitSubtype || '') : (block.cardioSubtype || '')}
                     onChange={(e) => updateBlock(s.id, block.id,
                       block.kind === 'hiit'
                         ? { hiitSubtype: e.target.value as any }
                         : { cardioSubtype: e.target.value as any }
                     )}
                     className="h-8 text-xs rounded border border-input bg-transparent px-2 flex-1"
                   >
                     <option value="">Subtype...</option>
                     {(block.kind === 'hiit' ? HIIT_SUBTYPES : CARDIO_SUBTYPES).map(st => (
                       <option key={st} value={st}>{st}</option>
                     ))}
                   </select>
                 </div>

                 {/* Kind-specific inputs */}
                 {block.kind === 'cardio' ? (
                   <div className="grid grid-cols-3 gap-2">
                     <Input
                       value={block.cardioDistance || ''}
                       onChange={(e) => updateBlock(s.id, block.id, { cardioDistance: e.target.value })}
                       placeholder="Distance"
                       className="h-8 text-xs"
                     />
                     <Input
                       value={block.cardioDuration || ''}
                       onChange={(e) => updateBlock(s.id, block.id, { cardioDuration: e.target.value })}
                       placeholder="Duration"
                       className="h-8 text-xs"
                     />
                     <Input
                       value={block.cardioUnits || ''}
                       onChange={(e) => updateBlock(s.id, block.id, { cardioUnits: e.target.value })}
                       placeholder="Units (mi, m, km)"
                       className="h-8 text-xs"
                     />
                   </div>
                 ) : (
                   <div className="grid grid-cols-2 gap-2">
                     <Input
                       type="number"
                       value={block.hiitReps || ''}
                       onChange={(e) => updateBlock(s.id, block.id, { hiitReps: parseInt(e.target.value) || undefined })}
                       placeholder="Reps/Rounds"
                       className="h-8 text-xs"
                     />
                     <Input
                       value={block.hiitStructure || ''}
                       onChange={(e) => updateBlock(s.id, block.id, { hiitStructure: e.target.value })}
                       placeholder="Structure (e.g. 20s work / 10s rest)"
                       className="h-8 text-xs"
                     />
                   </div>
                 )}
               </div>
             ))}
                    </div>
                  </div>
                )}
              </CardContent>

              {/* 3. BOTTOM SECTION: Input Row (Full Width Across Bottom) */}
              <CardFooter className="pt-3 border-t border-border bg-card/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                  <Button
                    onClick={() => addExerciseToSplit(s.id)}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground border border-dashed border-border hover:text-foreground"
                  >
                    <Plus size={14} className="mr-1.5" /> Add Exercise
                  </Button>
                  <Button
                    onClick={() => addHiitToSplit(s.id)}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground border border-dashed border-border hover:text-foreground"
                  >
                    <Plus size={14} className="mr-1.5" /> Add HIIT
                  </Button>
                  <Button
                    onClick={() => addCardioToSplit(s.id)}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground border border-dashed border-border hover:text-foreground"
                  >
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
