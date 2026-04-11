/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, loginWithGoogle, logout as firebaseLogout } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { GuestUser } from '../types';

interface FirebaseContextType {
  user: User | GuestUser | null;
  loading: boolean;
  isAuthReady: boolean;
  login: () => Promise<any>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | GuestUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Check for guest user in session storage on mount
    const savedGuest = sessionStorage.getItem('training_log_guest');
    if (savedGuest) {
      setUser(JSON.parse(savedGuest));
      setLoading(false);
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Ensure user document exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
          });
        }
      }
      setUser(currentUser);
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const loginAsGuest = () => {
    const guest: GuestUser = {
      uid: 'guest_' + Math.random().toString(36).substr(2, 9),
      email: 'guest@example.com',
      displayName: 'Guest User',
      isGuest: true
    };
    sessionStorage.setItem('training_log_guest', JSON.stringify(guest));
    setUser(guest);
  };

  const logout = async () => {
    if (user && 'isGuest' in user) {
      sessionStorage.removeItem('training_log_guest');
      sessionStorage.removeItem('guest_workouts');
      sessionStorage.removeItem('guest_splits');
      sessionStorage.removeItem('guest_exercises');
      setUser(null);
    } else {
      await firebaseLogout();
    }
  };

  const value = {
    user,
    loading,
    isAuthReady,
    login: loginWithGoogle,
    loginAsGuest,
    logout,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
