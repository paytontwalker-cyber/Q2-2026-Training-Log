import type { MuscleGroup } from '@/src/types';

export interface MappedRegion {
  slug: string;
  side: 'front' | 'back';
}

// Note: Upper Back and Lats each have their own SVG slug (upper-back and lats).
// They shade independently with their own volume and color.
//
// Maps each app MuscleGroup to one or more visual body regions.
// 'front' / 'back' indicates which body view shows that region.
export const MUSCLE_GROUP_TO_REGIONS: Partial<Record<MuscleGroup, MappedRegion[]>> = {
  'Chest':       [{ slug: 'chest', side: 'front' }],
  'Shoulders':   [{ slug: 'deltoids', side: 'front' }],
  'Side Delts':  [{ slug: 'deltoids', side: 'front' }, { slug: 'deltoids', side: 'back' }],
  'Rear Delts':  [{ slug: 'deltoids', side: 'back' }],
  'Triceps':     [{ slug: 'triceps', side: 'back' }],
  'Biceps':      [{ slug: 'biceps', side: 'front' }],
  'Forearms':    [{ slug: 'forearm', side: 'front' }, { slug: 'forearm', side: 'back' }],
  'Upper Back':  [{ slug: 'upper-back', side: 'back' }],
  'Lats':        [{ slug: 'lats', side: 'back' }],
  'Traps':       [{ slug: 'trapezius', side: 'back' }],
  'Lower Back':  [{ slug: 'lower-back', side: 'back' }],
  'Quads':       [{ slug: 'quadriceps', side: 'front' }],
  'Hamstrings':  [{ slug: 'hamstring', side: 'back' }],
  'Glutes':      [{ slug: 'gluteal', side: 'back' }],
  'Calves':      [
    { slug: 'calves', side: 'front' },
    { slug: 'calves', side: 'back' },
  ],
  'Lower Legs': [
    { slug: 'tibialis', side: 'front' },
    { slug: 'knees', side: 'front' },
    { slug: 'ankles', side: 'front' },
    { slug: 'feet', side: 'front' },
  ],
  'Core':        [{ slug: 'abs', side: 'front' }, { slug: 'obliques', side: 'front' }],
  // 'Functional', 'Plyos', 'Conditioning', 'Other' intentionally have no mapping
};
