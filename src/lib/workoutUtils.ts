import { Split, ProgrammedExercise, Conditioning, Block, BlockTemplate, LiftBlock, CardioBlock, HiitBlock, ExerciseEntry, CardioType } from '../types';

export const getDistanceInMeters = (c: Conditioning): number => {
  if (c.distanceInMeters !== undefined && c.distanceInMeters > 0) {
    return c.distanceInMeters;
  }
  
  const dist = parseFloat(c.workDistance || '0');
  const unit = c.workUnits?.toLowerCase();
  
  if (unit === 'miles' || unit === 'mi') return dist * 1609.34;
  if (unit === 'km') return dist * 1000;
  if (unit === 'meters' || unit === 'm') return dist;
  if (unit === 'yards' || unit === 'yd') return dist * 0.9144;
  
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
    
    if (c.type === 'Repeats' || c.type === 'Intervals') {
      if (c.reps) parts.push(`${c.reps} reps`);
      if (c.workDistance) parts.push(c.workDistance);
      if (c.workDuration) parts.push(c.workDuration);
    } else if (c.type === 'Zone 2' || c.type === 'Tempo') {
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
          type: block.subtype === 'Zone 2' ? 'Zone 2'
              : block.subtype === 'Incline Treadmill' ? 'Incline Treadmill'
              : block.subtype === 'Tempo' ? 'Tempo'
              : 'Other',
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
        const typeMap: Record<string, CardioType> = {
          '400m Repeats': 'Repeats',
          '800m Repeats': 'Repeats',
          'Mile Repeats': 'Repeats',
          'Ladders': 'Ladders',
          'Assault Bike Intervals': 'Intervals',
        };
        conditioning = {
          type: (block.subtype && typeMap[block.subtype]) || block.hiitType || 'Intervals',
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
    const hiitTypes: CardioType[] = ['Repeats', 'Intervals', 'Ladders'];
    const isHiit = conditioning.type && hiitTypes.includes(conditioning.type);

    if (isHiit) {
      blocks.push({
        id: Math.random().toString(36).substr(2, 9),
        kind: 'hiit',
        placement: 'after',
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
