/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Plus, Trash2, Search, X, AlertCircle, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MUSCLE_GROUPS } from '@/src/constants';
import { ExerciseLibraryEntry, MuscleGroup, MuscleContribution, ExerciseTrackingMode } from '@/src/types';
import { storage } from '@/src/services/storage';
import { useFirebase } from '@/src/components/FirebaseProvider';
import { useEffect } from 'react';

export default function Exercises() {
  const { user } = useFirebase();
  const [library, setLibrary] = useState<ExerciseLibraryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [newExercise, setNewExercise] = useState<{
    name: string;
    muscleGroup: MuscleGroup;
    muscleDistribution: MuscleContribution[];
    trackingMode: ExerciseTrackingMode;
  }>({ 
    name: '', 
    muscleGroup: 'Other' as MuscleGroup,
    muscleDistribution: [{ group: 'Other' as MuscleGroup, percent: 100 }],
    trackingMode: 'reps'
  });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseLibraryEntry | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = storage.subscribeToLibrary(user.uid, (data) => {
      setLibrary(data);
    });
    return () => unsubscribe();
  }, [user]);

  const groupedExercises = useMemo(() => {
    const filtered = library.filter(ex => 
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(search.toLowerCase())
    );

    const groups: Record<string, ExerciseLibraryEntry[]> = {};
    MUSCLE_GROUPS.forEach(mg => {
      const exs = filtered.filter(ex => ex.muscleGroup === mg).sort((a, b) => a.name.localeCompare(b.name));
      if (exs.length > 0) groups[mg] = exs;
    });
    return groups;
  }, [library, search]);

  const addExercise = async () => {
    if (!newExercise.name || !user) return;
    const totalPercent = newExercise.muscleDistribution.reduce((sum, d) => sum + d.percent, 0);
    if (totalPercent !== 100) return;

    const ex: ExerciseLibraryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      name: newExercise.name,
      muscleGroup: newExercise.muscleGroup,
      muscleDistribution: newExercise.muscleDistribution,
      trackingMode: newExercise.trackingMode,
    };
    await storage.saveLibraryItem(ex, user.uid);
    setNewExercise({ 
      name: '', 
      muscleGroup: 'Other',
      muscleDistribution: [{ group: 'Other', percent: 100 }],
      trackingMode: 'reps'
    });
    setIsAddOpen(false);
  };

  const updateExercise = async () => {
    if (!editingExercise || !user) return;
    const totalPercent = (editingExercise.muscleDistribution || []).reduce((sum, d) => sum + d.percent, 0);
    if (totalPercent !== 100) return;

    await storage.saveLibraryItem(editingExercise, user.uid);
    setEditingExercise(null);
    setIsEditOpen(false);
  };

  const removeExercise = async (id: string) => {
    await storage.deleteLibraryItem(id, user?.uid);
  };

  const handleAddContribution = (isEdit: boolean) => {
    if (isEdit && editingExercise) {
      setEditingExercise({
        ...editingExercise,
        muscleDistribution: [...(editingExercise.muscleDistribution || []), { group: 'Other', percent: 0 }]
      });
    } else {
      setNewExercise({
        ...newExercise,
        muscleDistribution: [...newExercise.muscleDistribution, { group: 'Other', percent: 0 }]
      });
    }
  };

  const handleRemoveContribution = (index: number, isEdit: boolean) => {
    if (isEdit && editingExercise) {
      const dist = [...(editingExercise.muscleDistribution || [])];
      dist.splice(index, 1);
      setEditingExercise({ ...editingExercise, muscleDistribution: dist });
    } else {
      const dist = [...newExercise.muscleDistribution];
      dist.splice(index, 1);
      setNewExercise({ ...newExercise, muscleDistribution: dist });
    }
  };

  const handleUpdateContribution = (index: number, field: 'group' | 'percent', value: any, isEdit: boolean) => {
    if (isEdit && editingExercise) {
      const dist = [...(editingExercise.muscleDistribution || [])];
      dist[index] = { ...dist[index], [field]: value };
      setEditingExercise({ ...editingExercise, muscleDistribution: dist });
    } else {
      const dist = [...newExercise.muscleDistribution];
      dist[index] = { ...dist[index], [field]: value };
      setNewExercise({ ...newExercise, muscleDistribution: dist });
    }
  };

  const getTotalPercent = (isEdit: boolean) => {
    const dist = isEdit ? editingExercise?.muscleDistribution : newExercise.muscleDistribution;
    return (dist || []).reduce((sum, d) => sum + d.percent, 0);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Exercise Library</h2>
          <p className="text-muted-foreground">Manage your custom exercises and muscle groups</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger
            render={
              <Button className="bg-maroon hover:bg-maroon-light text-white">
                <Plus size={18} className="mr-2" />
                Add New Exercise
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Exercise Name</Label>
                <Input 
                  placeholder="e.g. Bulgarian Split Squat" 
                  value={newExercise.name}
                  onChange={e => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Default Tracking Type</Label>
                <Select 
                  value={newExercise.trackingMode}
                  onValueChange={(val: ExerciseTrackingMode) => setNewExercise(prev => ({ ...prev, trackingMode: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reps">Reps</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="time">Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primary Muscle Group</Label>
                <Select 
                  value={newExercise.muscleGroup}
                  onValueChange={(val: MuscleGroup) => {
                    setNewExercise(prev => {
                      const newDist = [...prev.muscleDistribution];
                      if (newDist.length > 0) {
                        newDist[0].group = val;
                      }
                      return { ...prev, muscleGroup: val, muscleDistribution: newDist };
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select muscle group" />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.map(mg => (
                      <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Muscle Breakdown (%)</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleAddContribution(false)}
                    className="h-7 text-maroon hover:text-maroon-light hover:bg-maroon/5"
                  >
                    <Plus size={14} className="mr-1" /> Add Group
                  </Button>
                </div>

                <div className="space-y-3">
                  {newExercise.muscleDistribution.map((dist, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select 
                          value={dist.group}
                          onValueChange={(val: MuscleGroup) => handleUpdateContribution(idx, 'group', val, false)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MUSCLE_GROUPS.map(mg => (
                              <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20">
                        <Input 
                          type="number"
                          className="h-9"
                          value={dist.percent}
                          onChange={e => handleUpdateContribution(idx, 'percent', parseInt(e.target.value) || 0, false)}
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveContribution(idx, false)}
                        disabled={newExercise.muscleDistribution.length <= 1}
                        className="h-9 w-9 p-0 text-muted-foreground hover:text-red-500"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className={cn(
                  "flex items-center justify-between p-2 rounded-lg text-sm font-bold",
                  getTotalPercent(false) === 100 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                )}>
                  <div className="flex items-center gap-2">
                    {getTotalPercent(false) !== 100 && <AlertCircle size={14} />}
                    Total: {getTotalPercent(false)}%
                  </div>
                  {getTotalPercent(false) !== 100 && <span className="text-[10px] uppercase">Must be 100%</span>}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button 
                onClick={addExercise} 
                className="bg-maroon hover:bg-maroon-light"
                disabled={getTotalPercent(false) !== 100 || !newExercise.name}
              >
                Add Exercise
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Exercise</DialogTitle>
            </DialogHeader>
            {editingExercise && (
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label>Exercise Name</Label>
                  <Input 
                    value={editingExercise.name}
                    onChange={e => setEditingExercise({ ...editingExercise, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Tracking Type</Label>
                  <Select 
                    value={editingExercise.trackingMode || 'reps'}
                    onValueChange={(val: ExerciseTrackingMode) => setEditingExercise({ ...editingExercise, trackingMode: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reps">Reps</SelectItem>
                      <SelectItem value="distance">Distance</SelectItem>
                      <SelectItem value="time">Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primary Muscle Group</Label>
                  <Select 
                    value={editingExercise.muscleGroup}
                    onValueChange={(val: MuscleGroup) => {
                      const newDist = [...(editingExercise.muscleDistribution || [])];
                      if (newDist.length > 0) {
                        newDist[0].group = val;
                      }
                      setEditingExercise({ ...editingExercise, muscleGroup: val, muscleDistribution: newDist });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSCLE_GROUPS.map(mg => (
                        <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Muscle Breakdown (%)</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleAddContribution(true)}
                      className="h-7 text-maroon hover:text-maroon-light hover:bg-maroon/5"
                    >
                      <Plus size={14} className="mr-1" /> Add Group
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(editingExercise.muscleDistribution || []).map((dist, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Select 
                            value={dist.group}
                            onValueChange={(val: MuscleGroup) => handleUpdateContribution(idx, 'group', val, true)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MUSCLE_GROUPS.map(mg => (
                                <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-20">
                          <Input 
                            type="number"
                            className="h-9"
                            value={dist.percent}
                            onChange={e => handleUpdateContribution(idx, 'percent', parseInt(e.target.value) || 0, true)}
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveContribution(idx, true)}
                          disabled={(editingExercise.muscleDistribution || []).length <= 1}
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-red-500"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className={cn(
                    "flex items-center justify-between p-2 rounded-lg text-sm font-bold",
                    getTotalPercent(true) === 100 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    <div className="flex items-center gap-2">
                      {getTotalPercent(true) !== 100 && <AlertCircle size={14} />}
                      Total: {getTotalPercent(true)}%
                    </div>
                    {getTotalPercent(true) !== 100 && <span className="text-[10px] uppercase">Must be 100%</span>}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button 
                onClick={updateExercise} 
                className="bg-maroon hover:bg-maroon-light"
                disabled={getTotalPercent(true) !== 100 || !editingExercise?.name}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Search exercises or muscle groups..." 
          className="pl-10 h-12 text-lg border-border shadow-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Object.entries(groupedExercises) as [string, ExerciseLibraryEntry[]][]).map(([group, exercises]) => (
          <Card key={group} className="border-border shadow-sm">
            <CardHeader className="bg-muted/50 border-b border-border py-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-maroon flex items-center justify-between">
                {group}
                <span className="text-xs bg-maroon/10 text-maroon px-2 py-0.5 rounded-full font-medium">
                  {exercises.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {exercises.map(ex => (
                  <div key={ex.id} className="flex items-center justify-between p-3 hover:bg-muted transition-colors group">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{ex.name}</span>
                      {ex.muscleDistribution && ex.muscleDistribution.length > 0 && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {ex.muscleDistribution.map((dist, i) => (
                            <span key={i}>
                              {dist.group} {dist.percent}%
                              {i < (ex.muscleDistribution?.length || 0) - 1 && " • "}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingExercise({
                            ...ex,
                            muscleDistribution: ex.muscleDistribution || [{ group: ex.muscleGroup, percent: 100 }]
                          });
                          setIsEditOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-maroon h-8 w-8 p-0"
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeExercise(ex.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 h-8 w-8 p-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

