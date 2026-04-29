/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  orderBy,
  getDocs,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Workout, ExerciseLibraryEntry, Split, SavedSplit, UserProfile } from '../types';
import { INITIAL_EXERCISES, DEFAULT_SPLIT } from '../constants';

const removeUndefined = (obj: any): any => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
};

export const deepRemoveUndefined = (val: any): any => {
  if (val === undefined) return undefined; // caller removes key
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val
      .map(deepRemoveUndefined)
      .filter(v => v !== undefined);
  }
  if (typeof val === 'object') {
    const out: any = {};
    Object.keys(val).forEach(k => {
      const cleaned = deepRemoveUndefined(val[k]);
      if (cleaned !== undefined) out[k] = cleaned;
    });
    return out;
  }
  return val;
};

const normalizeDistribution = (dist: any[] = []) =>
  [...dist]
    .map(d => ({
      group: String(d.group || '').trim(),
      percent: Number(d.percent || 0),
    }))
    .sort((a, b) => a.group.localeCompare(b.group));

const distributionsEqual = (a: any[] = [], b: any[] = []) => {
  const na = normalizeDistribution(a);
  const nb = normalizeDistribution(b);

  if (na.length !== nb.length) return false;

  return na.every((item, index) =>
    item.group === nb[index].group &&
    item.percent === nb[index].percent
  );
};

const libDocId = (uid: string, id: string) => `${uid}_${id}`;

const sanitizeWorkoutRecord = (raw: unknown): Workout | null => {
  if (!raw || typeof raw !== 'object') return null;
  const w = raw as Partial<Workout>;
  return {
    ...w,
    id: typeof w.id === 'string' ? w.id : crypto.randomUUID(),
    date: typeof w.date === 'string' ? w.date : new Date().toISOString(),
    workoutName: typeof w.workoutName === 'string' ? w.workoutName : '',
    runningStats: typeof w.runningStats === 'string' ? w.runningStats : '',
    exercises: Array.isArray(w.exercises) ? w.exercises : [],
    inclineTreadmill: w.inclineTreadmill,
    postWorkoutEnergy: typeof w.postWorkoutEnergy === 'number' ? w.postWorkoutEnergy : 5,
    notes: typeof w.notes === 'string' ? w.notes : '',
    timestamp: typeof w.timestamp === 'number' ? w.timestamp : Date.now(),
    uid: w.uid,
    conditioning: w.conditioning,
    workoutSummary: w.workoutSummary,
    isHistorical: typeof w.isHistorical === 'boolean' ? w.isHistorical : false,
  } as Workout;
};

const sanitizeWorkoutList = (raw: unknown): Workout[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(sanitizeWorkoutRecord)
    .filter((w): w is Workout => !!w);
};

export const sanitizeDraftRecord = (raw: unknown): Partial<Workout> | null => {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Partial<Workout>;
  return {
    ...d,
    exercises: Array.isArray(d.exercises) ? d.exercises : [],
  };
};

export const sanitizeSplitRecord = (raw: unknown): Split | null => {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Partial<Split>;
  if (typeof s.day !== 'string' || typeof s.name !== 'string') return null;
  return {
    ...s,
    id: typeof s.id === 'string' ? s.id : crypto.randomUUID(),
    day: s.day,
    name: s.name,
    running: typeof s.running === 'string' ? s.running : 'None',

    exercises: Array.isArray(s.exercises) ? s.exercises : [],
    blocks: Array.isArray(s.blocks) ? s.blocks : [],
    summary: typeof s.summary === 'string' ? s.summary : '',
    uid: typeof s.uid === 'string' ? s.uid : '',
  } as Split;
};

const sanitizeSplitList = (raw: unknown): Split[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(sanitizeSplitRecord)
    .filter((s): s is Split => !!s);
};

export const storage = {
  // Workouts
  subscribeToWorkouts: (uid: string, callback: (workouts: Workout[]) => void) => {
    if (uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_workouts');
      let parsed: unknown = [];
      try {
        parsed = saved ? JSON.parse(saved) : [];
      } catch {
        parsed = [];
      }
      const normalizedWorkouts = sanitizeWorkoutList(parsed);
      // Self-heal: if the data was malformed, overwrite it
      if (JSON.stringify(normalizedWorkouts) !== saved) {
        sessionStorage.setItem('guest_workouts', JSON.stringify(normalizedWorkouts));
      }
      callback(normalizedWorkouts);
      // Mock unsubscribe
      return () => {};
    }

    const q = query(
      collection(db, 'workouts'), 
      where('uid', '==', uid),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const rawData = snapshot.docs
        .filter(doc => doc.exists())
        .map(doc => ({ id: doc.id, ...doc.data() }));
      
      callback(sanitizeWorkoutList(rawData));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'workouts');
    });
  },

  saveWorkout: async (workout: Workout, uid: string) => {
    if (uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_workouts');
      let parsed: unknown = [];
      try {
        parsed = saved ? JSON.parse(saved) : [];
      } catch {
        parsed = [];
      }
      const workouts: Workout[] = sanitizeWorkoutList(parsed);
      const index = workouts.findIndex(w => w.id === workout.id);
      if (index >= 0) {
        workouts[index] = { ...workout, uid };
      } else {
        workouts.unshift({ ...workout, uid });
      }
      sessionStorage.setItem('guest_workouts', JSON.stringify(workouts));
      return;
    }

    try {
      const workoutToSave = deepRemoveUndefined({ 
        ...workout, 
        workoutName: workout.workoutName || "",
        uid 
      });
      const docRef = doc(db, 'workouts', workout.id);
      await setDoc(docRef, workoutToSave, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workouts/${workout.id}`);
    }
  },

  deleteWorkout: async (id: string, uid?: string) => {
    if (uid?.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_workouts');
      let parsed: unknown = [];
      try {
        parsed = saved ? JSON.parse(saved) : [];
      } catch {
        parsed = [];
      }
      const workouts: Workout[] = sanitizeWorkoutList(parsed);
      const workoutToDelete = workouts.find(w => w.id === id);
      
      if (workoutToDelete) {
        // Move to deleted storage
        const savedDeleted = sessionStorage.getItem('guest_deleted_workouts');
        let parsedDeleted: unknown = [];
        try {
          parsedDeleted = savedDeleted ? JSON.parse(savedDeleted) : [];
        } catch {
          parsedDeleted = [];
        }
        const deletedWorkouts: any[] = Array.isArray(parsedDeleted) ? parsedDeleted : [];
        deletedWorkouts.unshift({
          ...workoutToDelete,
          deletedAt: Date.now(),
          originalId: workoutToDelete.id
        });
        sessionStorage.setItem('guest_deleted_workouts', JSON.stringify(deletedWorkouts));
      }

      const filtered = workouts.filter(w => w.id !== id);
      sessionStorage.setItem('guest_workouts', JSON.stringify(filtered));
      return;
    }

    try {
      if (uid) {
        // Fetch the workout first to copy it
        const q = query(collection(db, 'workouts'), where('uid', '==', uid));
        const snapshot = await getDocs(q);
        const workoutDoc = snapshot.docs.find(doc => doc.id === id);
        
        if (workoutDoc) {
          const workoutData = workoutDoc.data();
          const deletedRef = doc(db, 'deleted_workouts', id);
          await setDoc(deletedRef, {
            ...workoutData,
            deletedAt: Date.now(),
            originalId: id
          });
        }
      }
      await deleteDoc(doc(db, 'workouts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `workouts/${id}`);
    }
  },

  getDeletedWorkouts: async (uid: string) => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    if (uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_deleted_workouts');
      let parsed: unknown = [];
      try {
        parsed = saved ? JSON.parse(saved) : [];
      } catch {
        parsed = [];
      }
      const deletedWorkouts: any[] = Array.isArray(parsed) ? parsed : [];
      return deletedWorkouts.filter(w => w.deletedAt >= sevenDaysAgo);
    }

    try {
      const q = query(
        collection(db, 'deleted_workouts'),
        where('uid', '==', uid),
        where('deletedAt', '>=', sevenDaysAgo),
        orderBy('deletedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching deleted workouts:", error);
      return [];
    }
  },

  restoreWorkout: async (deletedWorkout: any, uid: string) => {
    const { deletedAt, originalId, ...workoutData } = deletedWorkout;
    
    // Ensure it has a valid ID for restoration
    const restoreId = originalId || deletedWorkout.id;
    const workoutToRestore = { ...workoutData, id: restoreId, uid };

    if (uid.startsWith('guest_')) {
      // 1. Add back to workouts
      const saved = sessionStorage.getItem('guest_workouts');
      let parsed: unknown = [];
      try {
        parsed = saved ? JSON.parse(saved) : [];
      } catch {
        parsed = [];
      }
      const workouts: Workout[] = sanitizeWorkoutList(parsed);
      workouts.unshift(workoutToRestore);
      sessionStorage.setItem('guest_workouts', JSON.stringify(workouts));

      // 2. Remove from deleted
      const savedDeleted = sessionStorage.getItem('guest_deleted_workouts');
      let parsedDeleted: unknown = [];
      try {
        parsedDeleted = savedDeleted ? JSON.parse(savedDeleted) : [];
      } catch {
        parsedDeleted = [];
      }
      const deletedWorkouts: any[] = Array.isArray(parsedDeleted) ? parsedDeleted : [];
      const filteredDeleted = deletedWorkouts.filter(w => w.id !== deletedWorkout.id);
      sessionStorage.setItem('guest_deleted_workouts', JSON.stringify(filteredDeleted));
      return;
    }

    try {
      // 1. Add back to workouts
      const docRef = doc(db, 'workouts', restoreId);
      await setDoc(docRef, workoutToRestore);
      
      // 2. Remove from deleted
      await deleteDoc(doc(db, 'deleted_workouts', deletedWorkout.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workouts/${restoreId}`);
    }
  },

  permanentlyDeleteWorkout: async (id: string, uid?: string) => {
    if (uid?.startsWith('guest_')) {
      const savedDeleted = sessionStorage.getItem('guest_deleted_workouts');
      let parsedDeleted: unknown = [];
      try {
        parsedDeleted = savedDeleted ? JSON.parse(savedDeleted) : [];
      } catch {
        parsedDeleted = [];
      }
      const deletedWorkouts: any[] = Array.isArray(parsedDeleted) ? parsedDeleted : [];
      const filteredDeleted = deletedWorkouts.filter(w => w.id !== id);
      sessionStorage.setItem('guest_deleted_workouts', JSON.stringify(filteredDeleted));
      return;
    }

    try {
      await deleteDoc(doc(db, 'deleted_workouts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `deleted_workouts/${id}`);
    }
  },

  // Library
  subscribeToLibrary: (uid: string, callback: (library: ExerciseLibraryEntry[]) => void) => {
    if (uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_exercises');
      let library = saved ? JSON.parse(saved) : [...INITIAL_EXERCISES];
      let changed = false;
      
      // Check for missing default exercises in guest mode
      const existingNames = new Set(library.map((ex: any) => ex.name.toLowerCase()));
      const missingDefaults = INITIAL_EXERCISES.filter(
        def => !existingNames.has(def.name.toLowerCase())
      );

      if (missingDefaults.length > 0) {
        library = [...library, ...missingDefaults];
        changed = true;
      }

      // Backfill missing distributions/fields for built-in exercises
      library = library.map((ex: any) => {
        const def = INITIAL_EXERCISES.find(d => 
          d.id === ex.id || d.name.toLowerCase() === ex.name.toLowerCase()
        );
        if (def) {
          const distributionNeedsSync = !distributionsEqual(ex.muscleDistribution || [], def.muscleDistribution || []);
          const needsMuscleGroup = !ex.muscleGroup;
          const needsTrackingMode = !ex.trackingMode;

          if (distributionNeedsSync || needsMuscleGroup || needsTrackingMode) {
            changed = true;
            return { 
              ...ex, 
              muscleDistribution: def.muscleDistribution,
              ...(needsMuscleGroup ? { muscleGroup: def.muscleGroup } : {}),
              ...(needsTrackingMode ? { trackingMode: def.trackingMode } : {})
            };
          }
        }
        return ex;
      });

      if (changed) {
        sessionStorage.setItem('guest_exercises', JSON.stringify(library));
      }

      callback(library);
      return () => {};
    }

    const q = query(collection(db, 'exercises'), where('uid', '==', uid));
    
    return onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed for new users
        await storage.seedLibrary(uid);
      } else {
        const library = snapshot.docs.map(doc => doc.data() as ExerciseLibraryEntry);
        
        // 1. Check for missing default exercises
        const existingNames = new Set(library.map(ex => ex.name.toLowerCase()));
        const missingDefaults = INITIAL_EXERCISES.filter(
          def => !existingNames.has(def.name.toLowerCase())
        );

        // 2. Check for existing exercises needing backfill or sync
        const exercisesToSync = library.filter(ex => {
          const def = INITIAL_EXERCISES.find(d => 
            d.id === ex.id || d.name.toLowerCase() === ex.name.toLowerCase()
          );
          if (!def) return false;
          
          return (
            !distributionsEqual(ex.muscleDistribution || [], def.muscleDistribution || []) ||
            !ex.muscleGroup ||
            !ex.trackingMode
          );
        });

        if (missingDefaults.length > 0 || exercisesToSync.length > 0) {
          // Add missing defaults
          for (const ex of missingDefaults) {
            const docRef = doc(db, 'exercises', libDocId(uid, ex.id));
            await setDoc(docRef, deepRemoveUndefined({ ...ex, uid }));
          }
          // Sync existing built-in exercises
          for (const ex of exercisesToSync) {
            const def = INITIAL_EXERCISES.find(d => 
              d.id === ex.id || d.name.toLowerCase() === ex.name.toLowerCase()
            );
            if (def) {
              const docRef = doc(db, 'exercises', libDocId(uid, ex.id));
              
              const needsMuscleGroup = !ex.muscleGroup;
              const needsTrackingMode = !ex.trackingMode;

              await setDoc(docRef, deepRemoveUndefined({ 
                ...ex, 
                muscleDistribution: def.muscleDistribution,
                ...(needsMuscleGroup ? { muscleGroup: def.muscleGroup } : {}),
                ...(needsTrackingMode ? { trackingMode: def.trackingMode } : {}),
                uid 
              }), { merge: true });
            }
          }
          // The snapshot will trigger again after these writes
        } else {
          callback(library);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'exercises');
    });
  },

  saveLibraryItem: async (item: ExerciseLibraryEntry, uid: string) => {
    if (uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_exercises');
      const library: ExerciseLibraryEntry[] = saved ? JSON.parse(saved) : [...INITIAL_EXERCISES];
      const index = library.findIndex(i => i.id === item.id);
      if (index >= 0) {
        library[index] = { ...item, uid };
      } else {
        library.push({ ...item, uid });
      }
      sessionStorage.setItem('guest_exercises', JSON.stringify(library));
      return;
    }

    try {
      const itemToSave = { ...item, uid };
      const docRef = doc(db, 'exercises', libDocId(uid, item.id));
      await setDoc(docRef, deepRemoveUndefined(itemToSave));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `exercises/${item.id}`);
    }
  },

  deleteLibraryItem: async (id: string, uid?: string) => {
    if (uid?.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_exercises');
      if (saved) {
        const library: ExerciseLibraryEntry[] = JSON.parse(saved);
        const filtered = library.filter(i => i.id !== id);
        sessionStorage.setItem('guest_exercises', JSON.stringify(filtered));
      }
      return;
    }

    try {
      if (!uid) {
        console.warn('[deleteLibraryItem] uid required for non-guest delete; aborting');
        return;
      }
      await deleteDoc(doc(db, 'exercises', libDocId(uid, id)));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `exercises/${id}`);
    }
  },

  // One-time fetch for seeding or initial load
  getLibraryOnce: async (uid: string): Promise<ExerciseLibraryEntry[]> => {
    if (uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_exercises');
      return saved ? JSON.parse(saved) : INITIAL_EXERCISES;
    }

    try {
      const q = query(collection(db, 'exercises'), where('uid', '==', uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ExerciseLibraryEntry);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'exercises');
      return [];
    }
  },

  seedLibrary: async (uid: string) => {
    if (uid.startsWith('guest_')) {
      sessionStorage.setItem('guest_exercises', JSON.stringify(INITIAL_EXERCISES));
      return;
    }

    try {
      for (const ex of INITIAL_EXERCISES) {
        const docRef = doc(db, 'exercises', libDocId(uid, ex.id));
        await setDoc(docRef, deepRemoveUndefined({ ...ex, uid }));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'exercises/seed');
    }
  },

  // Splits
  subscribeToSplits: (uid: string, callback: (splits: Split[]) => void) => {
    if (uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_splits');
      let parsed: unknown = [];
      try {
        parsed = saved ? JSON.parse(saved) : [];
      } catch {
        parsed = [];
      }
      const sanitized = sanitizeSplitList(parsed);
      if (JSON.stringify(sanitized) !== saved) {
        sessionStorage.setItem('guest_splits', JSON.stringify(sanitized));
      }
      callback(sanitized);
      return () => {};
    }

    const q = query(collection(db, 'splits'), where('uid', '==', uid));
    
    return onSnapshot(q, (snapshot) => {
      const rawSplits = sanitizeSplitList(snapshot.docs.map(doc => doc.data()));
      const dayMap: Record<string, Split> = {};
      rawSplits.forEach(s => {
        const isDeterministic = s.id === `${uid}_${s.day}`;
        if (!dayMap[s.day] || isDeterministic) {
          dayMap[s.day] = s;
        }
      });
      const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const splits = Object.values(dayMap).sort((a, b) => daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day));
      callback(splits);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'splits');
    });
  },

  saveSplit: async (split: Split, uid: string) => {
    if (uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_splits');
      let parsed: unknown = [];
      try {
        parsed = saved ? JSON.parse(saved) : [];
      } catch {
        parsed = [];
      }
      const splits: Split[] = sanitizeSplitList(parsed);
      const index = splits.findIndex(s => s.day === split.day);
      if (index >= 0) {
        splits[index] = { ...split, uid };
      } else {
        splits.push({ ...split, uid });
      }
      sessionStorage.setItem('guest_splits', JSON.stringify(splits));
      return;
    }

    try {
      // Use a deterministic ID: uid_day
      const docId = `${uid}_${split.day}`;
      const docRef = doc(db, 'splits', docId);
      const cleaned = deepRemoveUndefined({ 
        ...split, 
        name: split.name || "",
        running: split.running || "",
        uid, 
        id: docId 
      });
      await setDoc(docRef, cleaned);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `splits/${split.day}`);
    }
  },

  seedSplits: async (uid: string, templateDays?: any) => {
    const daysToUse = templateDays || DEFAULT_SPLIT;
    const splitsToSeed: Split[] = Object.entries(daysToUse).map(([day, data]: [string, any]) => ({
      id: `${uid}_${day}`,
      day,
      name: data.name,
      running: data.running,
      exercises: data.exercises,
      blocks: data.blocks || [],
      summary: data.summary || '',
      uid
    }));

    if (uid.startsWith('guest_')) {
      sessionStorage.setItem('guest_splits', JSON.stringify(sanitizeSplitList(splitsToSeed)));
      return;
    }

    try {
      for (const split of splitsToSeed) {
        await setDoc(doc(db, 'splits', split.id), deepRemoveUndefined(split));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'splits/seed');
    }
  },

  // Saved Splits
  subscribeToSavedSplits: (uid: string, callback: (savedSplits: SavedSplit[]) => void) => {
    if (uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_saved_splits');
      const savedSplits = saved ? JSON.parse(saved) : [];
      callback(savedSplits);
      return () => {};
    }

    const q = query(
      collection(db, 'saved_splits'), 
      where('uid', '==', uid),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const savedSplits = snapshot.docs.map(doc => doc.data() as SavedSplit);
      callback(savedSplits);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'saved_splits');
    });
  },

  saveSavedSplit: async (savedSplit: SavedSplit, uid: string) => {
    if (uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_saved_splits');
      const savedSplits: SavedSplit[] = saved ? JSON.parse(saved) : [];
      const index = savedSplits.findIndex(s => s.id === savedSplit.id);
      if (index >= 0) {
        savedSplits[index] = { ...savedSplit, uid };
      } else {
        savedSplits.unshift({ ...savedSplit, uid });
      }
      sessionStorage.setItem('guest_saved_splits', JSON.stringify(savedSplits));
      return;
    }

    try {
      const splitToSave = deepRemoveUndefined({ 
        ...savedSplit, 
        name: savedSplit.name || "",
        uid 
      });
      const docRef = doc(db, 'saved_splits', savedSplit.id);
      await setDoc(docRef, splitToSave);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `saved_splits/${savedSplit.id}`);
    }
  },

  deleteSavedSplit: async (id: string, uid?: string) => {
    if (uid?.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_saved_splits');
      if (saved) {
        const savedSplits: SavedSplit[] = JSON.parse(saved);
        const filtered = savedSplits.filter(s => s.id !== id);
        sessionStorage.setItem('guest_saved_splits', JSON.stringify(filtered));
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'saved_splits', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `saved_splits/${id}`);
    }
  },

  // Drafts
  subscribeToDraft: (uid: string, callback: (draft: Partial<Workout> | null) => void) => {
    if (uid.startsWith('guest_')) {
      const saved = sessionStorage.getItem('guest_workout_draft');
      let parsed: unknown = null;
      try {
        parsed = saved ? JSON.parse(saved) : null;
      } catch {
        parsed = null;
      }
      const sanitized = sanitizeDraftRecord(parsed);
      if (saved && !sanitized) {
        sessionStorage.removeItem('guest_workout_draft');
      }
      callback(sanitized);
      return () => {};
    }

    const docRef = doc(db, 'drafts', uid);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(sanitizeDraftRecord(doc.data()));
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `drafts/${uid}`);
    });
  },

  saveDraft: async (draft: Partial<Workout>, uid: string) => {
    if (uid.startsWith('guest_')) {
      const sanitized = sanitizeDraftRecord(draft);
      sessionStorage.setItem('guest_workout_draft', JSON.stringify(sanitized));
      return;
    }

    try {
      const docRef = doc(db, 'drafts', uid);
      await setDoc(docRef, deepRemoveUndefined({ ...draft, uid, timestamp: draft.timestamp ?? Date.now() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `drafts/${uid}`);
    }
  },

  clearDraft: async (uid: string) => {
    if (uid.startsWith('guest_')) {
      sessionStorage.removeItem('guest_workout_draft');
      return;
    }

    try {
      await deleteDoc(doc(db, 'drafts', uid));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `drafts/${uid}`);
    }
  },

  // ---------- Public Profile (3.6.0) ----------

  // Claim or update a username. Enforces uniqueness via the `usernames/{lowercase}` lookup collection.
  // Returns { success: true } on success, or { success: false, error: string } with a human-readable reason.
  claimUsername: async (uid: string, newUsername: string, currentUsernameLower?: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = newUsername.trim();
    
    // Validate format: 3-20 chars, alphanumeric + underscore, capitals allowed, no leading digit
    if (!/^[A-Za-z_][A-Za-z0-9_]{2,19}$/.test(trimmed)) {
      return { success: false, error: 'Username must be 3-20 characters, letters/numbers/underscores, and start with a letter or underscore.' };
    }
    
    const lower = trimmed.toLowerCase();
    const RESERVED = ['admin', 'coach', 'support', 'trainer', 'api', 'root', 'system', 'moderator', 'mod', 'help', 'about', 'contact', 'team'];
    if (RESERVED.includes(lower)) {
      return { success: false, error: 'That username is reserved.' };
    }
    
    // If user is just changing case of their own username, no uniqueness check needed
    if (currentUsernameLower && currentUsernameLower === lower) {
      try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { username: trimmed, usernameLower: lower, updatedAt: Date.now() });
        return { success: true };
      } catch (e) {
        return { success: false, error: 'Failed to update username. Try again.' };
      }
    }

    try {
      // Check if username doc exists
      const usernameRef = doc(db, 'usernames', lower);
      const existing = await getDoc(usernameRef);
      if (existing.exists() && existing.data().uid !== uid) {
        return { success: false, error: 'That username is already taken.' };
      }
      
      // Atomic-ish: write usernames/{lower} pointing to uid, then update user doc
      await setDoc(usernameRef, { uid, createdAt: Date.now() });
      
      // If user had a previous username, release it
      if (currentUsernameLower && currentUsernameLower !== lower) {
        try {
          await deleteDoc(doc(db, 'usernames', currentUsernameLower));
        } catch { /* ignore — best effort */ }
      }
      
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { username: trimmed, usernameLower: lower, updatedAt: Date.now() });
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Failed to claim username. Try again.' };
    }
  },

  // Update a user's privacy settings.
  updatePrivacy: async (uid: string, privacy: { profileVisible: boolean; emailSearchable: boolean }) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { privacy, updatedAt: Date.now() });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}`);
    }
  },

  // Search users by username prefix or email. Client-side filter for <100 users scale.
  // Respects privacy: hidden users are excluded from results. Email matches require emailSearchable.
  searchUsers: async (queryText: string, excludeUid?: string): Promise<UserProfile[]> => {
    const q = queryText.trim().toLowerCase();
    if (q.length < 2) return [];
    
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const results: UserProfile[] = [];
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as UserProfile;
        if (excludeUid && data.uid === excludeUid) return;
        
        const privacyOK = data.privacy?.profileVisible !== false; // default true
        if (!privacyOK) return;
        
        const usernameMatch = data.usernameLower && data.usernameLower.includes(q);
        const emailMatch = data.privacy?.emailSearchable !== false && 
                           data.email && data.email.toLowerCase().includes(q);
        const nameMatch = data.displayName && data.displayName.toLowerCase().includes(q);
        
        if (usernameMatch || emailMatch || nameMatch) {
          // Strip email if searcher found user by username/name (respect emailSearchable even on display)
          if (!data.privacy?.emailSearchable) {
            results.push({ ...data, email: '' });
          } else {
            results.push(data);
          }
        }
      });
      
      // Sort: username matches first, then name, then email
      return results.sort((a, b) => {
        const aUser = a.usernameLower?.startsWith(q) ? 0 : 1;
        const bUser = b.usernameLower?.startsWith(q) ? 0 : 1;
        return aUser - bUser;
      });
    } catch (e) {
      console.error('searchUsers failed:', e);
      return [];
    }
  },

  // Fetch a single public profile (respects privacy). Returns null if not found or private.
  getPublicProfile: async (uid: string): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return null;
      const data = snap.data() as UserProfile;
      if (data.privacy?.profileVisible === false) return null;
      if (!data.privacy?.emailSearchable) {
        return { ...data, email: '' };
      }
      return data;
    } catch (e) {
      console.error('getPublicProfile failed:', e);
      return null;
    }
  },

  // Fetch recent public workouts (for showing PRs / recent activity on a public profile).
  // Returns the 5 most recent workouts of the user if their profile is visible.
  getPublicWorkouts: async (uid: string, limit_val: number = 5): Promise<any[]> => {
    try {
      // Only fetch if profile is visible
      const profile = await storage.getPublicProfile(uid);
      if (!profile) return [];
      
      const workoutsRef = collection(db, 'workouts');
      const qRef = query(workoutsRef, where('uid', '==', uid));
      const snap = await getDocs(qRef);
      const all: any[] = [];
      snap.forEach(d => all.push({ id: d.id, ...d.data() }));
      
      return all
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, limit_val);
    } catch (e) {
      console.error('getPublicWorkouts failed:', e);
      return [];
    }
  }
};
