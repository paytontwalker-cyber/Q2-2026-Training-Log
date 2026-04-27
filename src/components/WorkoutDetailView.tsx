import { Badge } from '@/components/ui/badge';
import { normalizeEnergyToFivePoint } from '@/src/lib/workoutUtils';

export const formatExerciseSummary = (ex: any) => {
  if (ex.trackingMode === 'distance') {
    return `${ex.sets} sets x ${ex.distance || 0}${ex.distanceUnit || 'm'} @ ${ex.weight || 0} lbs`;
  }
  
  const hasPerSetWeights = ex.usePerSetWeights && Array.isArray(ex.perSetWeights) && ex.perSetWeights.length > 0;
  const hasPerSetReps = ex.usePerSetReps && Array.isArray(ex.perSetReps) && ex.perSetReps.length > 0;
  
  if (hasPerSetWeights && hasPerSetReps) {
    const details = Array.from({ length: ex.sets || 0 }).map((_, i) => `${ex.perSetReps[i] ?? ex.reps ?? '-'}x${ex.perSetWeights[i] ?? ex.weight ?? 0}`).join(', ');
    return `${ex.sets} sets: ${details} lbs`;
  } else if (hasPerSetWeights) {
    return `${ex.sets}x${ex.reps || '-'} (${ex.perSetWeights.join(', ')}) lbs`;
  } else if (hasPerSetReps) {
    return `${ex.sets} sets (${ex.perSetReps.join(', ')}) @ ${ex.weight || 0} lbs`;
  }
  return `${ex.sets}x${ex.reps || '-'} @ ${ex.weight || 0} lbs`;
};

export const renderCardioBlockDetails = (block: any) => {
  const subtype = block.subtype || 'Cardio';
  
  if (subtype === 'Repeats') {
    const splits = block.splits || [];
    return (
      <div className="space-y-2 text-foreground">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {block.splitCount !== undefined && (
            <div className="flex justify-between"><span className="text-muted-foreground">Reps:</span><span className="font-medium">{block.splitCount}</span></div>
          )}
          {block.restValue !== undefined && block.restValue > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Rest:</span><span className="font-medium">{block.restValue} {block.restUnit || 'sec'}</span></div>
          )}
          {block.averageHeartRate !== undefined && block.averageHeartRate > 0 && (
            <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Avg HR:</span><span className="font-medium">{block.averageHeartRate}</span></div>
          )}
        </div>
        {splits.length > 0 && splits.some((s: any) => s.timeStr || s.distanceVal) && (
          <div className="pt-2 border-t border-maroon/30/50">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Splits</span>
            <div className="flex flex-wrap gap-1">
              {splits.map((s: any, i: number) => (
                (s.timeStr || s.distanceVal) && (
                  <span key={i} className="bg-card px-1.5 py-0.5 rounded border border-maroon/30 text-[10px] text-muted-foreground">
                    {s.distanceVal || ''}{s.distanceUnit ? s.distanceUnit : ''} {s.timeStr || ''}
                  </span>
                )
              ))}
            </div>
          </div>
        )}
        {block.programmedNotes && (
          <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-maroon/30/50 whitespace-pre-wrap break-words">{block.programmedNotes}</p>
        )}
      </div>
    );
  }
  
  if (subtype === 'Zone 2') {
    return (
      <div className="space-y-2 text-foreground">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {block.programmedDistanceVal !== undefined && block.programmedDistanceVal > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Distance:</span><span className="font-medium">{block.programmedDistanceVal} {block.programmedDistanceUnit || 'mi'}</span></div>
          )}
          {block.zone2TimeStr && (
            <div className="flex justify-between"><span className="text-muted-foreground">Time:</span><span className="font-medium">{block.zone2TimeStr}</span></div>
          )}
          {block.zone2AverageHeartRate !== undefined && block.zone2AverageHeartRate > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Avg HR:</span><span className="font-medium">{block.zone2AverageHeartRate}</span></div>
          )}
        </div>
        {block.programmedNotes && (
          <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-maroon/30/50 whitespace-pre-wrap break-words">{block.programmedNotes}</p>
        )}
      </div>
    );
  }
  
  // Generic cardio fallback
  return (
    <div className="space-y-2 text-foreground">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {(block.programmedDistanceVal || block.programmedDistance) && (
          <div className="flex justify-between"><span className="text-muted-foreground">Distance:</span><span className="font-medium">{block.programmedDistanceVal || block.programmedDistance} {block.programmedDistanceUnit || ''}</span></div>
        )}
        {(block.programmedDurationVal || block.programmedDuration) && (
          <div className="flex justify-between"><span className="text-muted-foreground">Time:</span><span className="font-medium">{block.programmedDurationVal || block.programmedDuration} {block.programmedDurationUnit || ''}</span></div>
        )}
      </div>
      {block.programmedNotes && (
        <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-maroon/30/50 whitespace-pre-wrap break-words">{block.programmedNotes}</p>
      )}
    </div>
  );
};

export const renderHiitBlockDetails = (block: any) => {
  return (
    <div className="space-y-2 text-foreground">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {block.programmedReps !== undefined && block.programmedReps > 0 && (
          <div className="flex justify-between"><span className="text-muted-foreground">Rounds:</span><span className="font-medium">{block.programmedReps}</span></div>
        )}
        {(block.programmedWorkDistanceVal || block.programmedWorkDistance) && (
          <div className="flex justify-between"><span className="text-muted-foreground">Work Dist:</span><span className="font-medium">{block.programmedWorkDistanceVal || block.programmedWorkDistance} {block.programmedWorkDistanceUnit || ''}</span></div>
        )}
        {(block.programmedWorkDurationVal || block.programmedWorkDuration) && (
          <div className="flex justify-between"><span className="text-muted-foreground">Work Time:</span><span className="font-medium">{block.programmedWorkDurationVal || block.programmedWorkDuration} {block.programmedWorkDurationUnit || ''}</span></div>
        )}
      </div>
      {block.structureNotes && (
        <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-maroon/30/50 whitespace-pre-wrap break-words">{block.structureNotes}</p>
      )}
      {block.programmedNotes && block.programmedNotes !== block.structureNotes && (
        <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-maroon/30/50 whitespace-pre-wrap break-words">{block.programmedNotes}</p>
      )}
    </div>
  );
};

export function WorkoutDetailView({ workout }: { workout: any }) {
  if (!workout) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20">
          Energy: {normalizeEnergyToFivePoint(workout.postWorkoutEnergy)}/5
        </Badge>
        {workout.bodyWeight && (
          <Badge variant="outline" className="bg-maroon/10 text-maroon border-maroon/20">
            Bodyweight: {workout.bodyWeight} lbs
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exercises</h4>
          <div className="space-y-2">
            {(workout.exercises || []).length > 0 ? (workout.exercises || []).map((ex: any) => (
              <div key={ex.id} className="space-y-1 border-b border-maroon/30 pb-2 last:border-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{ex.name}</span>
                  <span className="text-muted-foreground shrink-0 text-right">
                    {formatExerciseSummary(ex)}
                  </span>
                </div>
                {ex.notes && (
                  <p className="text-[11px] text-muted-foreground italic">{ex.notes}</p>
                )}
                {ex.superset && (
                  <div className="flex items-center justify-between text-[11px] pl-3 border-l-2 border-maroon/20 text-maroon/70">
                    <span className="font-medium">+ {ex.superset.name}</span>
                    <span className="shrink-0 text-right">
                      {formatExerciseSummary(ex.superset)}
                    </span>
                  </div>
                )}
              </div>
            )) : <p className="text-sm text-muted-foreground italic">No formal exercises logged.</p>}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Details</h4>
          
          {workout.blocks && workout.blocks.length > 0 && workout.blocks.some((b: any) => b.kind === 'cardio' || b.kind === 'hiit') ? (
            <>
              {workout.blocks
                .filter((b: any) => b.kind === 'cardio' || b.kind === 'hiit')
                .map((block: any, idx: number) => (
                  <div key={block.id || idx} className="bg-muted/50 p-3 rounded-lg border border-maroon/30 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="bg-maroon/5 text-maroon border-maroon/10 text-[10px] uppercase font-bold">
                        {block.kind === 'hiit' 
                          ? (block.hiitType || block.subtype || 'HIIT') 
                          : (block.subtype || 'Cardio').toUpperCase()}
                      </Badge>
                      {(block.programmedName || (block.kind === 'cardio' && block.subtype)) && (
                        <span className="text-xs text-muted-foreground">{block.programmedName || block.subtype}</span>
                      )}
                    </div>
                    {block.kind === 'cardio' ? renderCardioBlockDetails(block) : renderHiitBlockDetails(block)}
                  </div>
                ))}
            </>
          ) : (
            workout.conditioning && workout.conditioning.type ? (
              <div className="bg-muted/50 p-3 rounded-lg border border-maroon/30 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="bg-maroon/5 text-maroon border-maroon/10 text-[10px] uppercase font-bold">
                    {workout.conditioning.type.toUpperCase()}
                  </Badge>
                  {workout.conditioning.name && (
                    <span className="text-xs text-muted-foreground">{workout.conditioning.name}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {(workout.conditioning.workDistance || workout.conditioning.workDuration) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Work:</span>
                      <span className="text-foreground font-medium">{workout.conditioning.workDistance || workout.conditioning.workDuration} {workout.conditioning.workUnits || ''}</span>
                    </div>
                  )}
                  {workout.conditioning.reps && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Reps:</span><span className="text-foreground font-medium">{workout.conditioning.reps}</span></div>
                  )}
                  {workout.conditioning.restType !== 'none' && workout.conditioning.restValue && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Rest:</span><span className="text-foreground font-medium">{workout.conditioning.restValue}</span></div>
                  )}
                  {workout.conditioning.targetSplit && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Target:</span><span className="text-foreground font-medium">{workout.conditioning.targetSplit}</span></div>
                  )}
                </div>
                {workout.conditioning.notes && (
                  <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-maroon/30/50 whitespace-pre-wrap break-words">{workout.conditioning.notes}</p>
                )}
              </div>
            ) : null
          )}
          
          {workout.notes && workout.notes.trim() !== '' && (
            <div className="bg-muted/50 p-3 rounded-lg border border-maroon/30 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="bg-maroon/5 text-maroon border-maroon/10 text-[10px] uppercase font-bold">
                  NOTES
                </Badge>
              </div>
              <p className="text-[12px] text-foreground font-medium leading-relaxed whitespace-pre-wrap break-words">{workout.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProgramDetailView({ selectedPlanned }: { selectedPlanned: any }) {
  if (!selectedPlanned) return null;
  return (
    <div className="space-y-4">
      {selectedPlanned.summary && selectedPlanned.summary.trim() !== '' && (
        <div className="bg-muted/50 p-3 rounded-lg border border-maroon/30 space-y-2">
          <Badge variant="outline" className="bg-maroon/5 text-maroon border-maroon/10 text-[10px] uppercase font-bold mb-1">
            Summary / Notes
          </Badge>
          <p className="text-[12px] text-foreground font-medium leading-relaxed whitespace-pre-wrap break-words">{selectedPlanned.summary}</p>
        </div>
      )}

      {selectedPlanned.blocks ? (
        <div className="space-y-3">
          {selectedPlanned.blocks.map((b: any, idx: number) => {
            if (b.kind === 'lift') {
              return (
                <div key={idx} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Exercises</h4>
                  <div className="space-y-2">
                    {(b.exercises || []).length > 0 ? b.exercises.map((ex: any, i: number) => (
                      <div key={i} className="space-y-1 border-b border-maroon/30 pb-2 last:border-0">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{ex.name || 'Custom Exercise'}</span>
                          <span className="text-muted-foreground shrink-0 text-right">
                            {ex.trackingMode === 'distance' 
                              ? `${ex.sets || 3} sets x ${ex.distance || '?'}${ex.distanceUnit || 'mi'}`
                              : `${ex.sets || 3}x${ex.reps || 10}`
                            }
                          </span>
                        </div>
                        {ex.notes && <p className="text-[11px] text-muted-foreground italic">{ex.notes}</p>}
                        {ex.superset && (
                          <div className="flex items-center justify-between text-[11px] pl-3 border-l-2 border-maroon/20 text-maroon/70">
                            <span className="font-medium">+ {ex.superset.name || 'Custom Superset'}</span>
                            <span className="shrink-0 text-right">
                              {ex.superset.trackingMode === 'distance' 
                                ? `${ex.superset.sets || 3} sets x ${ex.superset.distance || '?'}${ex.superset.distanceUnit || 'mi'}`
                                : `${ex.superset.sets || 3}x${ex.superset.reps || 10}`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    )) : <p className="text-sm text-muted-foreground italic">No required exercises.</p>}
                  </div>
                </div>
              );
            } else if (b.kind === 'cardio' || b.kind === 'hiit') {
              return (
                <div key={idx} className="bg-muted/50 p-3 rounded-lg border border-maroon/30 space-y-2 mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="bg-maroon/5 text-maroon border-maroon/10 text-[10px] uppercase font-bold">
                      {b.kind === 'hiit' ? (b.hiitType || b.subtype || 'HIIT') : (b.subtype || 'Cardio').toUpperCase()}
                    </Badge>
                    {(b.programmedName || (b.kind === 'cardio' && b.subtype)) && (
                      <span className="text-xs text-muted-foreground">{b.programmedName || b.subtype}</span>
                    )}
                  </div>
                  {b.kind === 'cardio' ? renderCardioBlockDetails(b) : renderHiitBlockDetails(b)}
                </div>
              );
            }
            return null;
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Exercises</h4>
          <div className="space-y-2">
            {(selectedPlanned.exercises || []).length > 0 ? selectedPlanned.exercises.map((ex: any, i: number) => {
              if (typeof ex === 'string') {
                return (
                  <div key={i} className="text-sm font-medium text-foreground border-b border-maroon/30 pb-2 last:border-0">{ex}</div>
                );
              }
              return (
                <div key={i} className="space-y-1 border-b border-maroon/30 pb-2 last:border-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{ex.name || 'Custom Exercise'}</span>
                    <span className="text-muted-foreground shrink-0 text-right">
                      {ex.trackingMode === 'distance' 
                        ? `${ex.sets || 3} sets x ${ex.distance || '?'}${ex.distanceUnit || 'mi'}`
                        : `${ex.sets || 3}x${ex.reps || 10}`
                      }
                    </span>
                  </div>
                  {ex.notes && <p className="text-[11px] text-muted-foreground italic">{ex.notes}</p>}
                  {ex.superset && (
                    <div className="flex items-center justify-between text-[11px] pl-3 border-l-2 border-maroon/20 text-maroon/70">
                      <span className="font-medium">+ {ex.superset.name || 'Custom Superset'}</span>
                      <span className="shrink-0 text-right">
                        {ex.superset.trackingMode === 'distance' 
                          ? `${ex.superset.sets || 3} sets x ${ex.superset.distance || '?'}${ex.superset.distanceUnit || 'mi'}`
                          : `${ex.superset.sets || 3}x${ex.superset.reps || 10}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              );
            }) : <p className="text-sm text-muted-foreground italic">Flexible day—no strict movements assigned.</p>}
          </div>

          {selectedPlanned.conditioning && (selectedPlanned.conditioning.type || selectedPlanned.conditioning.notes) && (
            <div className="bg-muted/50 p-3 rounded-lg border border-maroon/30 space-y-2 mt-4">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="bg-maroon/5 text-maroon border-maroon/10 text-[10px] uppercase font-bold">
                  {(selectedPlanned.conditioning.type || 'CONDITIONING').toUpperCase()}
                </Badge>
                {selectedPlanned.conditioning.name && (
                  <span className="text-xs text-muted-foreground">{selectedPlanned.conditioning.name}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {(selectedPlanned.conditioning.workDistance || selectedPlanned.conditioning.workDuration) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Work:</span>
                    <span className="text-foreground font-medium">{selectedPlanned.conditioning.workDistance || selectedPlanned.conditioning.workDuration} {selectedPlanned.conditioning.workUnits || ''}</span>
                  </div>
                )}
                {selectedPlanned.conditioning.reps && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Reps:</span><span className="text-foreground font-medium">{selectedPlanned.conditioning.reps}</span></div>
                )}
              </div>
              {selectedPlanned.conditioning.notes && (
                <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-maroon/30/50 whitespace-pre-wrap break-words">{selectedPlanned.conditioning.notes}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
