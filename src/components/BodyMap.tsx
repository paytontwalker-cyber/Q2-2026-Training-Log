import React, { useState, useMemo } from 'react';
import { BODY_FRONT_PATHS, BODY_BACK_PATHS } from '@/src/lib/bodyMapPaths';
import { MUSCLE_GROUP_TO_REGIONS } from '@/src/lib/bodyMapMapping';
import type { MuscleGroup } from '@/src/types';

interface BodyMapProps {
  muscleGroupData: { name: string; value: number }[];
}

const HEATMAP_COLORS = [
  '#FEF3C7',  // very light yellow
  '#FDE68A',  // yellow-orange
  '#FB923C',  // orange
  '#EA580C',  // dark orange
  '#DC2626',  // red
  '#991B1B',  // dark red
];
const NO_DATA_COLOR = '#E5E7EB'; // neutral gray

export function BodyMap({ muscleGroupData }: BodyMapProps) {
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
    
    if (maxVolume === 0) return HEATMAP_COLORS[0];
    const bucket = Math.min(5, Math.floor((entry.volume / maxVolume) * 6));
    return HEATMAP_COLORS[Math.max(0, bucket)];
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
    const [slug, side] = hoveredSlug.split('-') as [string, 'front'|'back'];
    const names = getMuscleGroupNames(slug, side);
    if (names.length === 0) return null; // Unmapped region
    const volume = getVolume(slug, side);
    return { names, volume };
  }, [hoveredSlug, volumeBySlug]);

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
          className="fixed z-50 bg-foreground text-background text-xs px-3 py-2 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-10px]"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className="font-bold mb-1">{hoveredData.names.join(', ')}</div>
          <div>Volume: {hoveredData.volume} sets</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-col items-center space-y-2">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Volume Scale</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Low</span>
          <div className="flex h-4 rounded overflow-hidden shadow-inner">
            {HEATMAP_COLORS.map((c, i) => (
              <div key={i} className="w-8 h-full" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>

      {/* Supplemental List */}
      <div className="mt-8">
        <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider border-b pb-2">Muscle Group Volumes</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {muscleGroupData.map(data => {
            const regions = MUSCLE_GROUP_TO_REGIONS[data.name as MuscleGroup];
            let color = NO_DATA_COLOR;
            if (regions && data.value > 0 && maxVolume > 0) {
              const bucket = Math.min(5, Math.floor((data.value / maxVolume) * 6));
              color = HEATMAP_COLORS[Math.max(0, bucket)];
            }
            
            return (
              <div key={data.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-sm border border-border" style={{ backgroundColor: color }} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{data.name}</span>
                  <span className="text-xs text-muted-foreground">{data.value} sets</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
