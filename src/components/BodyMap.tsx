import React, { useState, useMemo } from 'react';
import { BODY_FRONT_PATHS, BODY_BACK_PATHS } from '@/src/lib/bodyMapPaths';
import { MUSCLE_GROUP_TO_REGIONS } from '@/src/lib/bodyMapMapping';
import { BASE_VOLUME_TARGETS_180LB_INTERMEDIATE } from '@/src/constants';
import type { MuscleGroup } from '@/src/types';

interface BodyMapProps {
  muscleGroupData: { name: string; value: number }[];
  heatMode?: 'relative' | 'target';
  volumeTargets?: Record<string, number>;
  onMuscleClick?: (muscleGroup: string) => void;
}

// 10-step single-hue warm gradient, cream → deep maroon.
// All shades sit within the same color family for visual cohesion.
// Each step is perceptually distinguishable — cream, pale peach, peach,
// warm peach, soft orange, orange, deep orange, burnt orange, rust, deep maroon.
export const THERMAL_COLORS = [
  '#FCE4CC', // Level 1: Pale Peach
  '#FCD29F', // Level 2: Peach
  '#FDBA74', // Level 3: Warm Peach
  '#FB923C', // Level 4: Soft Orange
  '#F97316', // Level 5: Orange
  '#EA580C', // Level 6: Deep Orange (Near Target)
  '#C2410C', // Level 7: Burnt Orange (At Target)
  '#9A3412', // Level 8: Rust (High)
  '#7C1D1D', // Level 9: Deep Maroon
  '#450A0A', // Level 10: Darkest Maroon (Very High / Overreaching)
];

// Thresholds:
// RELATIVE mode: `percentage` = volume as % of the heatmap's max muscle volume.
//   Buckets scale linearly across 0-110%+ for even spread.
// TARGET mode:   `percentage` = volume as % of the muscle's weekly volume target.
//   Buckets cluster around 100% (target) so hitting target maps to a distinct color.
export const getVolumeColor = (percentage: number): string => {
  if (percentage <= 0)  return NO_DATA_COLOR; // Fallback
  if (percentage < 10)  return THERMAL_COLORS[0];  // Minimal (guaranteed if > 0)
  if (percentage < 20)  return THERMAL_COLORS[1];
  if (percentage < 30)  return THERMAL_COLORS[2];
  if (percentage < 45)  return THERMAL_COLORS[3];
  if (percentage < 60)  return THERMAL_COLORS[4];
  if (percentage < 75)  return THERMAL_COLORS[5];
  if (percentage < 90)  return THERMAL_COLORS[6];  // Near target
  if (percentage < 105) return THERMAL_COLORS[7];  // At target (target mode)
  if (percentage < 125) return THERMAL_COLORS[8];  // High / over target
  return THERMAL_COLORS[9];                         // Very high / overreaching
};

const NO_DATA_COLOR = '#E5E7EB'; // neutral gray

const ALIAS_MAP: Record<string, string> = {
  'Upper Back': 'Back',
  'Lats': 'Back',
  'Traps': 'Back',
  'Lower Back': 'Back',
};

const getTargetForSlug = (slug: string, targets: Record<string, number> = BASE_VOLUME_TARGETS_180LB_INTERMEDIATE) => {
  const muscleGroups = Object.entries(MUSCLE_GROUP_TO_REGIONS)
    .filter(([_, regions]) => regions?.some(r => r.slug === slug))
    .map(([name]) => name);

  const targetKeys = new Set<string>();
  let totalTarget = 0;

  muscleGroups.forEach(mg => {
    if (targets[mg]) {
      targetKeys.add(mg);
    } else if (ALIAS_MAP[mg] && targets[ALIAS_MAP[mg]]) {
      targetKeys.add(ALIAS_MAP[mg]);
    }
  });

  targetKeys.forEach(key => {
    totalTarget += targets[key];
  });

  return totalTarget;
};

export function BodyMap({ muscleGroupData, heatMode = 'target', volumeTargets, onMuscleClick }: BodyMapProps) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 1. Derive volumeBySlug
  const volumeBySlug = useMemo(() => {
    const map: Record<string, { side: 'front'|'back', volume: number }[]> = {};
    
    muscleGroupData.forEach(data => {
      const regions = MUSCLE_GROUP_TO_REGIONS[data.name as MuscleGroup];
      if (regions) {
        regions.forEach(region => {
          if (!map[region.slug]) {
            map[region.slug] = [];
          }
          const existing = map[region.slug].find(r => r.side === region.side);
          if (existing) {
            existing.volume += data.value;
          } else {
            map[region.slug].push({ side: region.side, volume: data.value });
          }
        });
      }
    });
    return map;
  }, [muscleGroupData]);

  // 2. Compute max volume
  const maxVolume = useMemo(() => {
    let max = 0;
    Object.values(volumeBySlug).forEach((entries) => {
      (entries as { side: 'front'|'back', volume: number }[]).forEach(entry => {
        if (entry.volume > max) max = entry.volume;
      });
    });
    return max;
  }, [volumeBySlug]);

  // Helper to get color
  const getColor = (slug: string, side: 'front'|'back') => {
    const entries = volumeBySlug[slug];
    if (!entries) return NO_DATA_COLOR;
    const entry = entries.find(e => e.side === side);
    if (!entry || entry.volume === 0) return NO_DATA_COLOR;
    
    let ratio = 0;
    if (heatMode === 'target') {
      const target = getTargetForSlug(slug, volumeTargets || BASE_VOLUME_TARGETS_180LB_INTERMEDIATE);
      if (target > 0) {
        ratio = entry.volume / target;
      } else {
        ratio = maxVolume > 0 ? entry.volume / maxVolume : 0;
      }
    } else {
      ratio = maxVolume > 0 ? entry.volume / maxVolume : 0;
    }

    return getVolumeColor(ratio * 100);
  };

  const getVolume = (slug: string, side: 'front'|'back') => {
    const entries = volumeBySlug[slug];
    if (!entries) return 0;
    const entry = entries.find(e => e.side === side);
    return entry ? entry.volume : 0;
  };

  const getMuscleGroupNames = (slug: string, side: 'front'|'back') => {
    const names: string[] = [];
    Object.entries(MUSCLE_GROUP_TO_REGIONS).forEach(([name, regions]) => {
      if (regions?.some(r => r.slug === slug && r.side === side)) {
        names.push(name);
      }
    });
    return names;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const renderPaths = (paths: typeof BODY_FRONT_PATHS, side: 'front'|'back') => {
    return paths.map(region => {
      const color = getColor(region.slug, side);
      const isHovered = hoveredSlug === `${region.slug}-${side}`;
      
      const pathStrings = [
        ...(region.path.left || []),
        ...(region.path.right || []),
        ...(region.path.common || [])
      ];

      return (
        <g 
          key={region.slug}
          onMouseEnter={() => setHoveredSlug(`${region.slug}-${side}`)}
          onMouseLeave={() => setHoveredSlug(null)}
          className="transition-opacity duration-200 cursor-pointer"
          style={{ opacity: isHovered ? 0.7 : 1 }}
        >
          {pathStrings.map((d, i) => (
            <path 
              key={i} 
              d={d} 
              fill={color} 
              stroke="#9CA3AF" 
              strokeWidth="1" 
            />
          ))}
        </g>
      );
    });
  };

  const hoveredData = useMemo(() => {
    if (!hoveredSlug) return null;
    const lastHyphenIndex = hoveredSlug.lastIndexOf('-');
    const slug = hoveredSlug.substring(0, lastHyphenIndex);
    const side = hoveredSlug.substring(lastHyphenIndex + 1) as 'front'|'back';
    const names = getMuscleGroupNames(slug, side);
    if (names.length === 0) return null; // Unmapped region
    
    // Look up each muscle group's individual volume from the input prop
    const groups = names.map(name => {
      const entry = muscleGroupData.find(d => d.name === name);
      return { name, volume: entry ? entry.value : 0 };
    });
    
    return { groups };
  }, [hoveredSlug, volumeBySlug, muscleGroupData]);

  return (
    <div className="flex flex-col space-y-8" onMouseMove={handleMouseMove}>
      <div className="flex flex-col md:flex-row gap-6 justify-center items-start">
        <div className="flex-1 max-w-xs w-full mx-auto">
          <h3 className="text-center text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Front</h3>
          <svg viewBox="0 0 724 1448" className="w-full h-auto drop-shadow-md">
            {renderPaths(BODY_FRONT_PATHS, 'front')}
          </svg>
        </div>
        <div className="flex-1 max-w-xs w-full mx-auto">
          <h3 className="text-center text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Back</h3>
          <svg viewBox="724 0 724 1448" className="w-full h-auto drop-shadow-md">
            {renderPaths(BODY_BACK_PATHS, 'back')}
          </svg>
        </div>
      </div>

      {hoveredData && (
        <div 
          className="fixed z-50 bg-foreground text-background text-xs px-3 py-2 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-10px] min-w-[160px]"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          {hoveredData.groups.map(g => (
            <div key={g.name} className="flex justify-between gap-3 py-0.5">
              <span className="font-bold">{g.name}</span>
              <span>{g.volume.toLocaleString()} lbs</span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-col items-center space-y-2">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Volume Scale</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Low</span>
          <div className="flex h-4 rounded overflow-hidden shadow-inner">
            {THERMAL_COLORS.map((c, i) => (
              <div key={i} className="w-8 h-full" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>

      {/* Supplemental List */}
      <div className="mt-8">
        <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider border-b pb-2">Muscle Group Volumes</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {muscleGroupData.map(data => {
            const regions = MUSCLE_GROUP_TO_REGIONS[data.name as MuscleGroup];
            let color = NO_DATA_COLOR;
            if (data.value > 0) {
              if (heatMode === 'target') {
                const target = (volumeTargets || BASE_VOLUME_TARGETS_180LB_INTERMEDIATE)[data.name] || 0;
                const ratio = target > 0 ? (data.value / target) * 100 : (maxVolume > 0 ? (data.value / maxVolume) * 100 : 0);
                color = getVolumeColor(ratio);
              } else {
                const ratio = maxVolume > 0 ? (data.value / maxVolume) * 100 : 0;
                color = getVolumeColor(ratio);
              }
            }
            
            return (
              <button
                key={data.name}
                type="button"
                onClick={() => onMuscleClick?.(data.name)}
                className={`w-full text-left rounded-xl border border-border bg-card/70 px-4 py-3 shadow-sm transition-all ${onMuscleClick ? 'cursor-pointer hover:border-maroon/40 hover:bg-maroon/5' : 'cursor-default'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full shrink-0 shadow-sm border border-border" style={{ backgroundColor: color }} />
                  <div className="min-w-0">
                    <div className="font-bold text-foreground truncate">{data.name}</div>
                    <div className="text-sm text-muted-foreground tabular-nums">
                      {data.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} lbs moved
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
