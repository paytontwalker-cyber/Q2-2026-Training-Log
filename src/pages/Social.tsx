import React, { useState, useEffect } from 'react';
import { Users, Search, User as UserIcon, Trophy, Calendar, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirebase } from '@/src/components/FirebaseProvider';
import { storage } from '@/src/services/storage';
import { UserProfile } from '@/src/types';
import { format } from 'date-fns';

type View = 'search' | 'view';

export default function Social() {
  const { user } = useFirebase();
  const [view, setView] = useState<View>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [selectedWorkouts, setSelectedWorkouts] = useState<any[]>([]);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      const found = await storage.searchUsers(searchTerm, user?.uid);
      setResults(found);
      setSearching(false);
    }, 250);
    return () => clearTimeout(handle);
  }, [searchTerm, user?.uid]);

  const openProfile = async (p: UserProfile) => {
    setSelectedProfile(p);
    setView('view');
    const wk = await storage.getPublicWorkouts(p.uid, 5);
    setSelectedWorkouts(wk);
  };

  const backToSearch = () => {
    setView('search');
    setSelectedProfile(null);
    setSelectedWorkouts([]);
  };

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Social</h2>
        <p className="text-muted-foreground">Find and view other users' public profiles.</p>
      </header>

      {view === 'search' && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search size={18} /> Find Users</CardTitle>
            <CardDescription>Search by username, display name, or email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
              <p className="text-xs text-muted-foreground">Type at least 2 characters.</p>
            )}
            {searching && <p className="text-xs text-muted-foreground">Searching...</p>}
            {!searching && searchTerm.trim().length >= 2 && results.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No users found.</p>
            )}
            <div className="space-y-2">
              {results.map(r => (
                <button
                  key={r.uid}
                  onClick={() => openProfile(r)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-muted border border-border text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {r.photoURL 
                      ? <img src={r.photoURL} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sm font-bold">{(r.displayName || r.username || '?')[0].toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">{r.displayName || 'Unnamed'}</div>
                    {r.username && <div className="text-xs text-muted-foreground truncate">@{r.username}</div>}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4 italic">
              Friends & activity feed coming soon.
            </p>
          </CardContent>
        </Card>
      )}

      {view === 'view' && selectedProfile && (
        <>
          <Button variant="ghost" onClick={backToSearch} className="gap-2">
            <ArrowLeft size={14} /> Back to search
          </Button>
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {selectedProfile.photoURL 
                  ? <img src={selectedProfile.photoURL} alt="" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold">{(selectedProfile.displayName || '?')[0].toUpperCase()}</span>}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">{selectedProfile.displayName || 'Unnamed'}</CardTitle>
                {selectedProfile.username && <p className="text-muted-foreground">@{selectedProfile.username}</p>}
                {selectedProfile.bio && <p className="text-sm text-foreground mt-2">{selectedProfile.bio}</p>}
              </div>
            </CardHeader>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Calendar size={16} /> Recent Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedWorkouts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No recent workouts to show.</p>
              ) : (
                <div className="space-y-2">
                  {selectedWorkouts.map((w: any) => (
                    <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                      <div>
                        <div className="text-sm font-bold">{w.workoutName || 'Untitled'}</div>
                        <div className="text-xs text-muted-foreground">
                          {w.date ? format(new Date(w.date), 'MMM d, yyyy') : ''} · {(w.exercises || []).length} exercises
                        </div>
                      </div>
                      {w.postWorkoutEnergy != null && (
                        <span className="text-[10px] font-bold text-maroon bg-maroon/10 border border-maroon/20 px-1.5 py-0.5 rounded">
                          {w.postWorkoutEnergy}/10
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
