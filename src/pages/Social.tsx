import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  UserCircle, 
  Activity, 
  Share2, 
  Search,
  Clock,
  Save,
  Eye,
  Trophy,
  BarChart2,
  Flame,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirebase } from '@/src/components/FirebaseProvider';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

type Tab = 'friends' | 'posts' | 'profile' | 'activity' | 'shared-splits';

const ComingSoonCard = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <Card className="border-slate-200 shadow-sm bg-slate-50/50">
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="text-slate-400" size={20} />
          <CardTitle className="text-lg text-slate-700">{title}</CardTitle>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-maroon/10 text-maroon border border-maroon/20">
          <Clock size={12} />
          Coming Soon
        </span>
      </div>
      <CardDescription className="text-slate-500 mt-2">{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-white">
        <p className="text-sm text-slate-400 text-center px-4">
          We're actively building this feature. Check back in a future update!
        </p>
      </div>
    </CardContent>
  </Card>
);

const SharedBadge = ({ type }: { type: 'AI' | 'Custom' }) => (
  <span className={cn(
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
    type === 'AI' ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"
  )}>
    {type === 'AI' ? 'AI Program · Gemini' : 'Custom Program'}
  </span>
);

export default function Social() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { user } = useFirebase();
  const [profile, setProfile] = useState({
    displayName: '',
    username: '',
    bio: '',
    photoURL: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !('isGuest' in user)) {
      const fetchProfile = async () => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile({
            displayName: data.displayName || user.displayName || '',
            username: data.username || '',
            bio: data.bio || '',
            photoURL: data.photoURL || '',
          });
        } else {
          setProfile({
            displayName: user.displayName || '',
            username: '',
            bio: '',
            photoURL: user.photoURL || '',
          });
        }
      };
      fetchProfile();
    }
  }, [user]);

  const saveProfile = async () => {
    if (!user || 'isGuest' in user) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profile.displayName.trim(),
        username: profile.username.trim(),
        bio: profile.bio.trim(),
        photoURL: profile.photoURL.trim(),
      });
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'posts', label: 'Posts', icon: MessageSquare },
    { id: 'shared-programs', label: 'Shared Programs', icon: Share2 },
  ] as const;

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Social</h2>
        <p className="text-muted-foreground">Connect with friends and share your training.</p>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-border">
        <div className="flex space-x-6 px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive 
                    ? "border-maroon text-maroon" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'friends' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search athletes or friends..." 
                className="pl-10 bg-white"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    const val = searchQuery.trim();
                    
                    // Search Firestore
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef);
                    const querySnapshot = await getDocs(q);
                    const results = querySnapshot.docs
                      .map(doc => ({ id: doc.id, ...doc.data() }))
                      .filter((u: any) => 
                        u.displayName?.toLowerCase().includes(val.toLowerCase()) || 
                        u.username?.toLowerCase().includes(val.toLowerCase())
                      );
                    
                    setSearchResults(results);
                    
                    const updated = [val, ...recentSearches.filter(s => s !== val)].slice(0, 5);
                    setRecentSearches(updated);
                    localStorage.setItem('recentSearches', JSON.stringify(updated));
                  }
                }}
              />
            </div>

            {!searchQuery && (
              <div className="space-y-6">
                {recentSearches.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-500">Recent Searches</h3>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map(s => (
                        <Button key={s} variant="outline" size="sm" onClick={() => setSearchQuery(s)}>{s}</Button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-6">
                    <Card><CardHeader><CardTitle className="text-lg">Pending Requests</CardTitle></CardHeader><CardContent className="text-sm text-slate-500">No pending requests.</CardContent></Card>
                    <Card><CardHeader><CardTitle className="text-lg">Sent Requests</CardTitle></CardHeader><CardContent className="text-sm text-slate-500">No sent requests.</CardContent></Card>
                  </div>
                  <div className="space-y-6">
                    <Card><CardHeader><CardTitle className="text-lg">Suggested Athletes</CardTitle></CardHeader><CardContent className="text-sm text-slate-500">No suggested athletes yet.</CardContent></Card>
                  </div>
                </div>
              </div>
            )}

            {searchQuery && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500">Results</h3>
                {searchResults.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                    <p className="text-sm text-slate-500">No users found</p>
                  </div>
                ) : (
                      searchResults.map(u => (
                        <Card key={u.id}><CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <UserCircle className="text-slate-400" size={32} />
                            <div>
                              <p className="font-medium">{u.displayName}</p>
                              <p className="text-sm text-slate-500">@{u.username}</p>
                            </div>
                          </div>
                          {u.id === user?.uid && <Badge variant="secondary">You</Badge>}
                        </CardContent></Card>
                      ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <ComingSoonCard 
            title="Posts" 
            description="Share workout logs and progress updates."
            icon={MessageSquare}
          />
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{isPreviewMode ? 'Public Profile Preview' : 'Profile'}</CardTitle>
                  <CardDescription>{isPreviewMode ? 'How others see your profile.' : 'Your public training identity and shared stats.'}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)}>
                    <Eye className="mr-2" size={16} />
                    {isPreviewMode ? 'Edit Profile' : 'Preview as Others'}
                  </Button>
                  <Button variant="ghost" className="text-slate-500">
                     View Public Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => !isPreviewMode && document.getElementById('photo-upload')?.click()}>
                        {profile.photoURL ? (
                          <img 
                            src={profile.photoURL} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-12 w-12 text-slate-300" />
                        )}
                      </div>
                      {!isPreviewMode && <input 
                        id="photo-upload"
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfile({...profile, photoURL: reader.result as string});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />}
                    </div>
                    <div className="text-center md:text-left space-y-2 flex-1">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{profile.displayName || 'Your Name'}</h3>
                        <p className="text-sm font-medium text-maroon">@{profile.username || 'username'}</p>
                      </div>
                      <p className="text-sm text-slate-600 max-w-md">
                        {profile.bio || 'Training, discipline, and progress.'}
                      </p>
                    </div>
                  </div>

                {!isPreviewMode && (
                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input 
                          id="displayName"
                          value={profile.displayName}
                          onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username"
                          value={profile.username}
                          onChange={(e) => setProfile({...profile, username: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio"
                        value={profile.bio}
                        onChange={(e) => setProfile({...profile, bio: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <Button onClick={saveProfile} disabled={saving} className="bg-maroon hover:bg-maroon-light text-white">
                      <Save className="mr-2" size={16} />
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </div>
                )}
                {isPreviewMode && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
                    {[
                      { label: 'Programs Created', value: '—', icon: Trophy },
                      { label: 'Logs Shared', value: '—', icon: BarChart2 },
                      { label: 'Current Streak', value: '—', icon: Flame },
                      { label: 'Training Focus', value: '—', icon: Target },
                    ].map(stat => (
                      <Card key={stat.label} className="bg-slate-50 border-slate-200">
                        <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                          <stat.icon className="text-maroon" size={20} />
                          <p className="text-xs text-slate-500">{stat.label}</p>
                          <p className="font-bold text-slate-800">{stat.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'activity' && (
          <ComingSoonCard 
            title="Activity" 
            description="See friend updates and training activity."
            icon={Activity}
          />
        )}

        {activeTab === 'shared-programs' && (
          <ComingSoonCard 
            title="Shared Programs" 
            description="Browse and share training programs."
            icon={Share2}
          />
        )}
      </div>
    </div>
  );
}
