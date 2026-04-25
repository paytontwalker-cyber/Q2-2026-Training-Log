import { Split, ProgrammedExercise, Conditioning, Block, BlockTemplate, LiftBlock, CardioBlock, HiitBlock, ExerciseEntry, CardioType, CardioSubtype } from '../types';

export const safeNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const calculateLoggedExerciseVolume = (ex: any) => {
  if (ex.trackingMode === 'distance') {
    // Distance-based volume: sets * (distance / 100) * weight
    const dist = safeNumber(ex.distance) || safeNumber(ex.distanceVal) || 0;
    const weight = safeNumber(ex.weight);
    const sets = safeNumber(ex.sets);
    return sets * (dist / 100) * weight;
  }
  if (ex.trackingMode === 'time') {
    // Time-based volume: sets * time * weight
    const time = safeNumber(ex.time) || safeNumber(ex.timeVal) || 0;
    const weight = safeNumber(ex.weight);
    const sets = safeNumber(ex.sets);
    return sets * time * weight;
  }
  if (ex.usePerSetWeights && ex.perSetWeights && Array.isArray(ex.perSetWeights) && ex.perSetWeights.length > 0) {
    // Use actual logged weights * reps
    return ex.perSetWeights.reduce((sum: number, w: number) => sum + (safeNumber(ex.reps) * safeNumber(w)), 0);
  }
  return safeNumber(ex.sets) * safeNumber(ex.reps) * safeNumber(ex.weight);
};

export const flattenLoggedExercises = (exercises: any[] = []): any[] => {
  const flattened: any[] = [];
  const seen = new Set<string>();

  const getExerciseKey = (exercise: any, path: string) => {
    return String(
      exercise?.id ||
      exercise?.entryId ||
      exercise?.logId ||
      `${path}:${exercise?.name || 'unknown'}:${exercise?.sets || ''}:${exercise?.reps || ''}:${exercise?.weight || ''}:${exercise?.distance || ''}`
    );
  };

  const getChildren = (exercise: any): any[] => {
    let children: any[] = [];
    if (Array.isArray(exercise?.superset)) children = children.concat(exercise.superset);
    else if (exercise?.superset) children.push(exercise.superset);
    
    if (Array.isArray(exercise?.supersetExercises)) children = children.concat(exercise.supersetExercises);
    if (Array.isArray(exercise?.children)) children = children.concat(exercise.children);
    return children;
  };

  const visit = (exercise: any, path: string) => {
    if (!exercise) return;

    const key = getExerciseKey(exercise, path);
    if (!seen.has(key)) {
      seen.add(key);
      flattened.push(exercise);
    }

    getChildren(exercise).forEach((child, index) => {
      visit(child, `${path}.superset.${index}`);
    });
  };

  exercises.forEach((exercise, index) => visit(exercise, String(index)));

  return flattened;
};

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
  if (['km', 'kilometer', 'kilometers', 'k'].includes(unit)) return dist * 1000;
  if (['meters', 'meter', 'm'].includes(unit)) return dist;
  if (['yards', 'yard', 'yd', 'yds'].includes(unit)) return dist * 0.9144;
  if (['feet', 'foot', 'ft'].includes(unit)) return dist * 0.3048;
  
  return 0;
};

export const normalizeCardioBlock = (cb: CardioBlock): Conditioning => {
  let workDistance = cb.loggedDistance || cb.programmedDistance;
  let workDuration = cb.loggedDuration || cb.programmedDuration;
  let workUnits = cb.loggedUnits || cb.programmedUnits;
  let averagePace = cb.loggedAveragePace;
  let actualSplits: string[] | undefined = undefined;
  let reps: number | undefined = undefined;
  let averageHeartRate = cb.averageHeartRate || cb.zone2AverageHeartRate;

  if (cb.subtype === 'Repeats' && cb.splits && cb.splits.length > 0) {
    const totals = calculateRepeatsTotals(cb.splits);
    workDistance = cb.splits[0].distanceVal.toString();
    workUnits = cb.splits[0].distanceUnit;
    workDuration = totals.avgTimePerSplitStr;
    averagePace = totals.paceStr;
    actualSplits = cb.splits.map(s => s.timeStr);
    reps = cb.splits.length;
  } else if (cb.subtype === 'Zone 2' && cb.programmedDistanceVal && cb.zone2TimeStr) {
    workDistance = cb.programmedDistanceVal.toString();
    workDuration = cb.zone2TimeStr;
    workUnits = cb.programmedDistanceUnit || 'mi';
    const totals = calculateRepeatsTotals([{ distanceVal: cb.programmedDistanceVal, distanceUnit: workUnits, timeStr: cb.zone2TimeStr }]);
    averagePace = totals.paceStr;
  }

  return {
    type: cb.subtype as CardioType,
    name: cb.programmedName || cb.subtype || '',
    workDistance,
    workDuration,
    workUnits,
    averagePace,
    incline: cb.loggedIncline,
    speed: cb.loggedSpeed,
    notes: cb.loggedNotes || cb.programmedNotes,
    actualSplits,
    reps,
    averageHeartRate,
  } as Conditioning;
};

export const normalizeHiitBlock = (hb: HiitBlock): Conditioning => {
  return {
    type: (hb.subtype as CardioType) || hb.hiitType || 'Intervals',
    name: hb.programmedName || '',
    reps: hb.programmedReps,
    workDistance: hb.programmedWorkDistance,
    workDuration: hb.programmedWorkDuration,
    workUnits: hb.programmedWorkUnits,
    restType: hb.programmedRestType,
    restValue: hb.programmedRestValue,
    structure: hb.programmedStructure || hb.structureNotes,
    targetSplit: hb.programmedTargetSplit,
    actualSplits: hb.loggedActualSplits,
    averagePace: hb.loggedAveragePace,
    notes: hb.loggedNotes,
  } as Conditioning;
};

export interface ConditioningClassification {
  category: string;
  protocolKey: string;
  repeatDistance?: number;
  repeatUnit?: string;
  label: string;
}

export const formatDistance = (meters: number, unit: 'mi' | 'm' | 'km' = 'mi'): string => {
  if (meters === 0) return '0';
  if (unit === 'mi') {
    const miles = meters / 1609.34;
    return Number.isInteger(miles) ? miles.toString() : miles.toFixed(2);
  }
  if (unit === 'km') {
    const km = meters / 1000;
    return Number.isInteger(km) ? km.toString() : km.toFixed(2);
  }
  return Number.isInteger(meters) ? meters.toString() : meters.toFixed(0);
};

export const formatPace = (secondsPerMile: number): string => {
  if (secondsPerMile <= 0) return '--:--';
  const mins = Math.floor(secondsPerMile / 60);
  const secs = Math.round(secondsPerMile % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDurationReadable = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);

  if (hours > 0) {
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    if (seconds === 0) return `${minutes}m`;
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

export const classifyConditioningSession = (c: Conditioning | null | undefined): ConditioningClassification => {
  if (!c) {
    return { category: 'Other', protocolKey: 'Other', label: 'Other Conditioning' };
  }

  const type = String(c.type || c.name || '').trim();
  const lowerType = type.toLowerCase();
  
  if (lowerType === 'zone 2' || lowerType.includes('zone 2')) {
    return { category: 'Zone 2', protocolKey: 'Zone 2', label: 'Zone 2' };
  }

  if (lowerType === 'repeats' || lowerType.includes('repeats') || lowerType === 'sprints') {
    let distance = 0;
    let unit = 'm';
    let mixed = false;

    if (c.actualSplits && c.actualSplits.length > 0) {
      if (c.workDistance && c.workDistance.trim() !== '') {
        const d = parseFloat(c.workDistance);
        if (!isNaN(d)) {
          distance = d;
          unit = (c.workUnits || 'm').toLowerCase();
        }
      }
    } else if (c.workDistance && c.workDistance.trim() !== '') {
        const d = parseFloat(c.workDistance);
        if (!isNaN(d)) {
          distance = d;
          unit = (c.workUnits || 'm').toLowerCase();
        }
    }

    if (mixed) {
      return { category: 'Repeats', protocolKey: 'Repeats:Mixed', label: 'Mixed Repeats' };
    } else if (distance > 0) {
      if ((distance === 1600 && (unit === 'm' || unit === 'meters')) || (distance === 1 && (unit === 'mi' || unit === 'mile' || unit === 'miles'))) {
        return { category: 'Repeats', protocolKey: 'Repeats:1mi', repeatDistance: 1, repeatUnit: 'mi', label: '1-Mile Repeats' };
      } else if (distance === 400 && (unit === 'm' || unit === 'meters')) {
        return { category: 'Repeats', protocolKey: 'Repeats:400m', repeatDistance: 400, repeatUnit: 'm', label: '400m Repeats' };
      } else if (distance === 800 && (unit === 'm' || unit === 'meters')) {
        return { category: 'Repeats', protocolKey: 'Repeats:800m', repeatDistance: 800, repeatUnit: 'm', label: '800m Repeats' };
      } else if (distance === 200 && (unit === 'm' || unit === 'meters')) {
        return { category: 'Repeats', protocolKey: 'Repeats:200m', repeatDistance: 200, repeatUnit: 'm', label: '200m Repeats' };
      } else {
        const unitLabel = unit === 'm' || unit === 'meters' ? 'm' : unit === 'mi' || unit === 'mile' || unit === 'miles' ? 'mi' : unit;
        return { category: 'Repeats', protocolKey: `Repeats:${distance}${unitLabel}`, repeatDistance: distance, repeatUnit: unitLabel, label: `${distance}${unitLabel} Repeats` };
      }
    }

    return { category: 'Repeats', protocolKey: 'Repeats:Mixed', label: 'Mixed Repeats' };
  }

  if (lowerType === 'ladders' || lowerType.includes('ladder')) {
    return { category: 'Ladders', protocolKey: 'Ladders', label: 'Ladders' };
  }

  if (lowerType === 'intervals' || lowerType.includes('interval')) {
    return { category: 'Intervals', protocolKey: 'Intervals', label: 'Intervals' };
  }

  if (lowerType === 'incline treadmill' || lowerType.includes('treadmill')) {
    return { category: 'Incline Treadmill', protocolKey: 'Incline Treadmill', label: 'Incline Treadmill' };
  }

  if (lowerType === 'bike') {
    return { category: 'Bike', protocolKey: 'Bike', label: 'Bike' };
  }

  if (lowerType === 'ruck' || lowerType.includes('ruck')) {
    return { category: 'Ruck', protocolKey: 'Ruck', label: 'Ruck' };
  }

  if (['metcon', 'amrap', 'emom'].includes(lowerType)) {
    return { category: type.toUpperCase(), protocolKey: type.toUpperCase(), label: type.toUpperCase() };
  }

  return { category: 'Other', protocolKey: 'Other', label: type ? type : 'Other Conditioning' };
};

export const normalizeConditioning = (conditioning: Conditioning | undefined, blocks: Block[] | undefined): Conditioning | null => {
  if (blocks && blocks.length > 0) {
    const conditioningBlock = blocks.find(b => b.kind === 'cardio' || b.kind === 'hiit');
    if (conditioningBlock) {
      if (conditioningBlock.kind === 'cardio') {
        return normalizeCardioBlock(conditioningBlock as CardioBlock);
      } else {
        return normalizeHiitBlock(conditioningBlock as HiitBlock);
      }
    }
  }
  if (conditioning && (conditioning.type || conditioning.name)) {
    return conditioning;
  }
  return null;
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

export const normalizeEnergyToFivePoint = (value: unknown): number => {
  if (typeof value !== 'number' || isNaN(value)) return 3;
  if (value < 1) return 1;
  if (value <= 5) return Math.round(value);
  const normalized = Math.ceil(value / 2);
  return Math.max(1, Math.min(5, normalized));
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
      if (block.kind === 'cardio') {
        conditioning = normalizeCardioBlock(block as CardioBlock);
      } else {
        conditioning = normalizeHiitBlock(block as HiitBlock);
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
      const cardioBlock: CardioBlock = {
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
      };

      if (conditioning.type === 'Repeats' && conditioning.actualSplits && conditioning.actualSplits.length > 0) {
        cardioBlock.splitCount = conditioning.reps || conditioning.actualSplits.length;
        cardioBlock.splits = conditioning.actualSplits.map(timeStr => ({
          distanceVal: parseFloat(conditioning.workDistance || '0'),
          distanceUnit: conditioning.workUnits || 'm',
          timeStr
        }));
      } else if (conditioning.type === 'Zone 2') {
        cardioBlock.programmedDistanceVal = parseFloat(conditioning.workDistance || '0');
        cardioBlock.programmedDistanceUnit = conditioning.workUnits || 'mi';
        cardioBlock.zone2TimeStr = conditioning.workDuration;
      }

      blocks.push(cardioBlock);
    }
  }

  return blocks;
};

export const parseTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return (isNaN(minutes) ? 0 : minutes * 60) + (isNaN(seconds) ? 0 : seconds);
  }
  return parseInt(timeStr, 10) || 0;
};

export const formatSeconds = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const calculateRepeatsTotals = (
  splits: { distanceVal: number; distanceUnit: string; timeStr: string }[]
) => {
  let totalDistance = 0;
  let totalTimeSeconds = 0;
  
  splits.forEach(split => {
    totalDistance += split.distanceVal;
    totalTimeSeconds += parseTime(split.timeStr);
  });
  
  const totalTimeMinutes = totalTimeSeconds / 60;
  const pace = totalDistance > 0 ? totalTimeMinutes / totalDistance : 0;
  
  const paceMinutes = Math.floor(pace);
  const paceSeconds = Math.round((pace - paceMinutes) * 60);
  const paceStr = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;

  return { 
    totalDistance, 
    totalTimeSeconds, 
    totalTimeStr: formatSeconds(totalTimeSeconds),
    avgTimePerSplitStr: formatSeconds(splits.length > 0 ? totalTimeSeconds / splits.length : 0),
    paceStr 
  };
};

export const calculateZone2Pace = (
  distanceVal: number,
  distanceUnit: string,
  timeStr: string
) => {
  const totalTimeSeconds = parseTime(timeStr);
  const totalTimeMinutes = totalTimeSeconds / 60;
  const pace = distanceVal > 0 ? totalTimeMinutes / distanceVal : 0;
  
  const paceMinutes = Math.floor(pace);
  const paceSeconds = Math.round((pace - paceMinutes) * 60);
  const paceStr = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;

  return `${paceStr} / ${distanceUnit}`;
};
