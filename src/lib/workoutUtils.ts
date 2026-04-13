import { Split, ProgrammedExercise, Conditioning, Block, BlockTemplate, LiftBlock, CardioBlock, HiitBlock, ExerciseEntry, CardioType, CardioSubtype } from '../types';

export const getDistanceInMeters = (c: Conditioning): number => {
  if (c.distanceInMeters !== undefined && c.distanceInMeters > 0) {
    return c.distanceInMeters;
  }
  
  // Supports both structured (workDistance + workUnits) and freeform (workDistance contains units) formats
  let distStr = c.workDistance || '0';
  let unit = c.workUnits?.toLowerCase();

  // If unit is missing, try to extract it from workDistance
  if (!unit) {
    const match = distStr.match(/(\d+(?:\.\d+)?)\s*([a-z]+)/i);
    if (match) {
      distStr = match[1];
      unit = match[2].toLowerCase();
    }
  }

  const dist = parseFloat(distStr);
  if (isNaN(dist)) return 0;
  
  if (!unit) return 0;

  if (['miles', 'mile', 'mi'].includes(unit)) return dist * 1609.34;
  if (['km', 'kilometer', 'kilometers'].includes(unit)) return dist * 1000;
  if (['meters', 'meter', 'm'].includes(unit)) return dist;
  if (['yards', 'yard', 'yards'].includes(unit)) return dist * 0.9144;
  
  return 0;
};

export const cleanSummary = (text: string): string => {
  if (!text) return '';
  return text
    .split('\n')
    .map(line => {
      // Remove common weight/load patterns
      return line
        .replace(/Ref:\s*[^-\n]*/gi, '')
        .replace(/@\s*[^-\n]*/gi, '')
        .replace(/\d+\s*lbs/gi, '')
        .replace(/\d+\s*plates/gi, '')
        .replace(/Heavy/gi, '')
        .replace(/Approx\.\s*[^-\n]*/gi, '')
        .replace(/\s+-\s*$/, '') // Clean up trailing dashes
        .trim();
    })
    .filter(line => line.length > 0)
    .join('\n');
};

export const generateWorkoutSnapshot = (split: Split): string => {
  let runningLine = '';
  if (split.running) {
    runningLine = `Running\n- ${split.running}`;
  }

  let conditioningLine = '';
  if (split.conditioning?.name || split.conditioning?.type) {
    const c = split.conditioning;
    const parts = [];
    
    if (c.type === 'Repeats' || c.type === 'Intervals' || c.type === 'METCON' || c.type === 'AMRAP' || c.type === 'EMOM') {
      if (c.reps) parts.push(`${c.reps} reps`);
      if (c.workDistance) parts.push(c.workDistance);
      if (c.workDuration) parts.push(c.workDuration);
    } else if (c.type === 'Zone 2' || c.type === 'Bike' || c.type === 'Ruck') {
      if (c.workDistance) parts.push(c.workDistance);
      if (c.workDuration) parts.push(c.workDuration);
    } else if (c.type === 'Ladders') {
      if (c.structure) parts.push(c.structure);
    }

    const name = c.name || c.type || 'Conditioning';
    conditioningLine = `Conditioning\n- ${name}${parts.length > 0 ? ` - ${parts.join(' ')}` : ''}`;
  }

  const exerciseLines = split.exercises.map(ex => {
    const name = typeof ex === 'string' ? ex : ex.name;
    const sets = typeof ex === 'string' ? '' : ex.sets;
    const reps = typeof ex === 'string' ? '' : ex.reps;
    const targetNotes = typeof ex === 'string' ? '' : ex.targetNotes;
    
    let details = '';
    if (sets && reps) details = `${sets}x${reps}`;
    else if (sets) details = `${sets} sets`;
    else if (reps) details = `${reps} reps`;

    let line = `- ${name}${details ? ` - ${details}` : ''}`;
    if (targetNotes) line += ` (${targetNotes})`;
    return line;
  });

  const exercisesSection = exerciseLines.length > 0 ? `Exercises\n${exerciseLines.join('\n')}` : '';

  return [runningLine, conditioningLine, exercisesSection].filter(Boolean).join('\n\n');
};

export const sanitizeData = (data: any): any => {
  if (data === null || data === undefined) return null;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: any = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== undefined) {
        sanitized[key] = sanitizeData(value);
      }
    });
    return sanitized;
  }
  
  return data;
};

// Project a Block[] array back to the legacy flat shape so downstream
// pages (History, Progress, Export) continue to read exercises and
// conditioning without change. Used at save time in 2.6.1+.
export const projectBlocksToLegacy = (blocks: Block[]): {
  exercises: ExerciseEntry[];
  conditioning?: Conditioning;
} => {
  const exercises: ExerciseEntry[] = [];
  let conditioning: Conditioning | undefined;

  for (const block of blocks) {
    if (block.kind === 'lift') {
      exercises.push(...block.exercises);
    } else if (!conditioning && (block.kind === 'cardio' || block.kind === 'hiit')) {
      // Project the FIRST cardio or HIIT block into the legacy conditioning field.
      // Additional cardio/HIIT blocks are preserved in `blocks` but not mirrored to
      // the legacy field (downstream pages only support one conditioning entry).
      if (block.kind === 'cardio') {
        conditioning = {
          type: block.subtype as CardioType,
          name: block.programmedName || '',
          workDistance: block.loggedDistance || block.programmedDistance,
          workDuration: block.loggedDuration || block.programmedDuration,
          workUnits: block.loggedUnits || block.programmedUnits,
          averagePace: block.loggedAveragePace,
          incline: block.loggedIncline,
          speed: block.loggedSpeed,
          notes: block.loggedNotes || block.programmedNotes,
        };
      } else {
        // hiit
        conditioning = {
          type: (block.subtype as CardioType) || block.hiitType || 'Intervals',
          name: block.programmedName || '',
          reps: block.programmedReps,
          workDistance: block.programmedWorkDistance,
          workDuration: block.programmedWorkDuration,
          workUnits: block.programmedWorkUnits,
          restType: block.programmedRestType,
          restValue: block.programmedRestValue,
          structure: block.programmedStructure || block.structureNotes,
          targetSplit: block.programmedTargetSplit,
          actualSplits: block.loggedActualSplits,
          averagePace: block.loggedAveragePace,
          notes: block.loggedNotes,
        };
        if (block.exercises) {
          exercises.push(...block.exercises);
        }
      }
    }
  }

  return { exercises, conditioning };
};

// Derive a Block[] array from the legacy flat shape. Used in 2.6.1 when
// loading a legacy Workout or Split into the block-based Daily Log UI.
export const deriveBlocksFromLegacy = (
  exercises: ExerciseEntry[],
  conditioning?: Conditioning
): Block[] => {
  const blocks: Block[] = [];

  if (exercises && exercises.length > 0) {
    blocks.push({
      id: Math.random().toString(36).substr(2, 9),
      kind: 'lift',
      exercises: [...exercises],
    } as LiftBlock);
  }

  if (conditioning && (conditioning.type || conditioning.name)) {
    const hiitTypes: CardioType[] = ['METCON', 'AMRAP', 'EMOM'];
    const isHiit = conditioning.type && hiitTypes.includes(conditioning.type);

    if (isHiit) {
      blocks.push({
        id: Math.random().toString(36).substr(2, 9),
        kind: 'hiit',
        placement: 'after',
        hiitType: conditioning.type as 'METCON' | 'AMRAP' | 'EMOM',
        programmedName: conditioning.name,
        programmedReps: conditioning.reps,
        programmedWorkDistance: conditioning.workDistance,
        programmedWorkDuration: conditioning.workDuration,
        programmedWorkUnits: conditioning.workUnits,
        programmedRestType: conditioning.restType,
        programmedRestValue: conditioning.restValue,
        programmedStructure: conditioning.structure,
        programmedTargetSplit: conditioning.targetSplit,
        loggedActualSplits: conditioning.actualSplits,
        loggedAveragePace: conditioning.averagePace,
        loggedNotes: conditioning.notes,
      } as HiitBlock);
    } else {
      blocks.push({
        id: Math.random().toString(36).substr(2, 9),
        kind: 'cardio',
        placement: 'after',
        subtype: conditioning.type as CardioSubtype,
        programmedName: conditioning.name,
        programmedDistance: conditioning.workDistance,
        programmedDuration: conditioning.workDuration,
        programmedUnits: conditioning.workUnits,
        loggedAveragePace: conditioning.averagePace,
        loggedIncline: conditioning.incline,
        loggedSpeed: conditioning.speed,
        loggedNotes: conditioning.notes,
      } as CardioBlock);
    }
  }

  return blocks;
};
