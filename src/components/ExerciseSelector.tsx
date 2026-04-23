/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExerciseLibraryEntry, MuscleGroup } from "@/src/types";
import { MUSCLE_GROUPS } from "@/src/constants";

interface ExerciseSelectorProps {
  exercises: ExerciseLibraryEntry[];
  value: string;
  onSelect: (exercise: ExerciseLibraryEntry) => void;
  placeholder?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function ExerciseSelector({
  exercises,
  value,
  onSelect,
  placeholder = "Select exercise...",
  className,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  hideTrigger,
}: ExerciseSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [search, setSearch] = useState("");

  const filteredExercises = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return exercises;

    // Check if term matches an exact muscle group
    const matchedMuscleGroup = MUSCLE_GROUPS.find(
      (mg) => mg.toLowerCase() === term,
    );

    if (matchedMuscleGroup) {
      // If exact muscle group match, show ONLY exercises in that group
      return exercises.filter((ex) => ex.muscleGroup === matchedMuscleGroup);
    }

    // Otherwise, normal name search
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(term) ||
        ex.muscleGroup.toLowerCase().includes(term),
    );
  }, [exercises, search]);

  const groupedExercises = useMemo(() => {
    const groups: Record<MuscleGroup, ExerciseLibraryEntry[]> = {} as any;

    // Initialize groups
    MUSCLE_GROUPS.forEach((mg) => {
      groups[mg] = [];
    });

    // Populate groups
    filteredExercises.forEach((ex) => {
      if (groups[ex.muscleGroup]) {
        groups[ex.muscleGroup].push(ex);
      } else {
        // Fallback for any unknown muscle groups
        if (!groups["Other"]) groups["Other"] = [];
        groups["Other"].push(ex);
      }
    });

    // Sort exercises within each group
    Object.keys(groups).forEach((mg) => {
      groups[mg as MuscleGroup].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [filteredExercises]);

  const selectedExercise = exercises.find((ex) => ex.name === value);

  const SelectorContent = (
    <Command
      shouldFilter={false}
      className="flex flex-col h-full max-h-[80vh] md:max-h-[400px]"
    >
      <CommandInput
        placeholder="Search exercise or muscle group..."
        value={search}
        onValueChange={setSearch}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      />
      <CommandList className="flex-1 overflow-y-auto">
        <CommandEmpty>No exercise found.</CommandEmpty>
        {MUSCLE_GROUPS.map((mg) => {
          const groupExercises = groupedExercises[mg];
          if (groupExercises.length === 0) return null;

          return (
            <CommandGroup key={mg} heading={mg}>
              {groupExercises.map((exercise) => (
                <CommandItem
                  key={exercise.id}
                  value={exercise.name}
                  onSelect={() => {
                    onSelect(exercise);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === exercise.name ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{exercise.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </Command>
  );

  const Trigger = (
    <button
      type="button"
      role="combobox"
      aria-expanded={open}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => setOpen(!open)}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "w-full justify-between font-normal h-auto min-h-9 py-2 whitespace-normal text-left",
        className,
      )}
    >
      {selectedExercise ? (
        <span className="flex items-center gap-2 flex-wrap">
          <span className="font-medium break-words">
            {selectedExercise.name}
          </span>
          <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
            {selectedExercise.muscleGroup}
          </span>
        </span>
      ) : (
        <span className="text-muted-foreground">{placeholder}</span>
      )}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && <DialogTrigger render={Trigger} />}
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Select Exercise</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">{SelectorContent}</div>
      </DialogContent>
    </Dialog>
  );
}
