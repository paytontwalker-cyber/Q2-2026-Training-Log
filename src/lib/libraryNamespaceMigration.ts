/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * v4.1.1 one-time migration: move exercise library docs from the legacy shared
 * path `exercises/{id}` to the per-user namespaced path `exercises/{uid}_{id}`.
 *
 * Gated by userProfile.libraryNamespaceMigrationV1 so it runs exactly once per
 * user. Safe to re-run if interrupted mid-flight (idempotent: writes the new
 * doc first, then deletes the old one; if the new one already exists at the
 * new path, the old one is just deleted).
 */
import { collection, doc, getDocs, query, setDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { deepRemoveUndefined } from '@/src/services/storage';
import type { ExerciseLibraryEntry } from '@/src/types';

export async function runLibraryNamespaceMigrationV1(uid: string): Promise<number> {
  if (uid.startsWith('guest_')) return 0;

  let moved = 0;
  try {
    // Query all exercise docs owned by this user.
    const q = query(collection(db, 'exercises'), where('uid', '==', uid));
    const snapshot = await getDocs(q);

    for (const snap of snapshot.docs) {
      const data = snap.data() as ExerciseLibraryEntry & { uid: string };
      const docId = snap.id;
      const expected = `${uid}_${data.id}`;
      if (docId === expected) continue; // already namespaced

      // Write to the new path first.
      try {
        const newRef = doc(db, 'exercises', expected);
        await setDoc(newRef, deepRemoveUndefined(data));
        // Then delete the legacy doc.
        await deleteDoc(doc(db, 'exercises', docId));
        moved++;
      } catch (err) {
        console.warn(`[libraryNamespaceMigrationV1] failed to migrate ${docId}:`, err);
      }
    }
  } catch (err) {
    console.error('[libraryNamespaceMigrationV1] fatal:', err);
    throw err;
  }

  return moved;
}
