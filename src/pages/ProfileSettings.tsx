/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, LogOut, LogIn, Settings, Info, ShieldCheck, AlertTriangle, UserCircle, Save, Download, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFirebase } from '@/src/components/FirebaseProvider';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/src/components/ThemeProvider';
import { THEME_PRESETS, ThemeMode } from '../theme';
import { APP_VERSION } from '../constants';
import Export from './Export';

const ROADMAP_ITEMS = [
  {
    category: 'Progress Page',
    items: [
      'Date range filter for historical analysis',
      'Sort controls on Volume Targets',
      'Exercise filter for progress charts',
      'Long-term trend analysis across weeks/months',
    ],
  },
  {
    category: 'Daily Log',
    items: [
      'Block-level drag-and-drop reordering',
      'Collapse/expand individual blocks',
      'Duplicate block action',
      'Visual placement tags (Before / After / Separate Session)',
      'Clearer programmed vs logged value differentiation',
    ],
  },
  {
    category: 'Split Page',
    items: [
      'Multi-block day editor (e.g. define "Lift + HIIT" explicitly on one day)',
    ],
  },
  {
    category: 'History',
    items: [
      'Filter by exercise or date range',
      'Full-text search across workouts',
    ],
  },
  {
    category: 'Calendar & Scheduling',
    items: [
      'Proper date picker / week view on Daily Log',
      'Week/month calendar navigation',
    ],
  },
  {
    category: 'Theming',
    items: [
      'Optional dark mode reintroduction (charcoal palette is already in index.css)',
    ],
  },
  {
    category: 'Authentication',
    items: [
      'Passwordless email sign-in',
      'Account recovery flow',
    ],
  },
  {
    category: 'Integrations',
    items: [
      'Garmin Connect import',
      'Strava import',
      'Apple Health import',
    ],
  },
];

export default function ProfileSettings() {
  const { user, login, logout } = useFirebase();
  const { primaryColor, secondaryColor, themeMode, setTheme } = useTheme();
  const isGuest = user && 'isGuest' in user;
  const [profile, setProfile] = useState({
    height: '',
    weight: '',
    goalWeight: '',
    birthday: '',
    sex: '',
  });
  const [appSettings, setAppSettings] = useState(() => {
    const savedTheme = localStorage.getItem('traininglog_theme');
    const savedUnits = localStorage.getItem('traininglog_units');
    const theme = savedTheme ? JSON.parse(savedTheme) : { primaryColor, secondaryColor, themeMode };
    const units = savedUnits ? JSON.parse(savedUnits) : { weightUnit: 'lbs', heightUnit: 'in', distanceUnit: 'miles' };
    return { ...theme, ...units };
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !isGuest) {
      const fetchProfile = async () => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile({
            height: data.height || '',
            weight: data.weight || '',
            goalWeight: data.goalWeight || '',
            birthday: data.birthday || '',
            sex: data.sex || '',
          });
          setAppSettings({
            weightUnit: data.weightUnit || 'lbs',
            heightUnit: data.heightUnit || 'in',
            distanceUnit: data.distanceUnit || 'miles',
            primaryColor: data.primaryColor || primaryColor,
            secondaryColor: data.secondaryColor || secondaryColor,
            themeMode: data.themeMode || themeMode,
          });
          setTheme(data.primaryColor || primaryColor, data.secondaryColor || secondaryColor, data.themeMode || themeMode);
        }
      };
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isGuest]);

  const saveProfile = async () => {
    if (!user || isGuest) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, profile);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveAppSettings = async () => {
    localStorage.setItem('traininglog_theme', JSON.stringify({ primaryColor: appSettings.primaryColor, secondaryColor: appSettings.secondaryColor, themeMode: appSettings.themeMode }));
    localStorage.setItem('traininglog_units', JSON.stringify({ weightUnit: appSettings.weightUnit, heightUnit: appSettings.heightUnit, distanceUnit: appSettings.distanceUnit }));
    setTheme(appSettings.primaryColor, appSettings.secondaryColor, appSettings.themeMode);
    
    if (user && !isGuest) {
      setSaving(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, appSettings);
      } catch (error) {
        console.error('Error saving app settings:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const calculateAge = (birthday: string) => {
    if (!birthday) return '';
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  return (
    <div className="space-y-6">
      <header className="no-print">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Profile & Settings</h2>
        <p className="text-slate-500">Manage your account and app preferences</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Account / Session */}
        <Card className="border-border shadow-sm md:col-span-2 no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="text-maroon" size={20} />
              Account / Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-xl border border-border">
              <div className="w-12 h-12 rounded-full bg-maroon/10 flex items-center justify-center text-maroon font-bold text-lg border border-maroon/20">
                {user?.displayName?.[0] || user?.email?.[0] || 'G'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-foreground truncate">
                  {user?.displayName || (isGuest ? 'Guest User' : 'User')}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {isGuest ? 'Temporary local session' : user?.email}
                </p>
              </div>
              {isGuest ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                  Guest
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1">
                  <ShieldCheck size={10} /> Verified
                </span>
              )}
            </div>

            {isGuest && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 font-bold">Data Warning</AlertTitle>
                <AlertDescription className="text-amber-700 text-sm">
                  You are currently in Guest Mode. Your data is stored locally in your browser session and will be lost if you clear your cache or switch browsers. Sign in to sync your data to the cloud.
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-2">
              {isGuest ? (
                <Button 
                  onClick={login}
                  className="w-full bg-maroon hover:bg-maroon-light text-white h-11"
                >
                  <LogIn className="mr-2" size={18} />
                  Sign In with Google
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={logout}
                  className="w-full border-border text-muted-foreground hover:text-red-600 hover:bg-muted h-11"
                >
                  <LogOut className="mr-2" size={18} />
                  Sign Out
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Profile Details */}
        <Card className="border-border shadow-sm no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="text-maroon" size={20} />
              Profile Details
            </CardTitle>
            <CardDescription>
              Manage your personal body metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGuest ? (
              <div className="p-4 bg-muted rounded-lg border border-border text-sm text-muted-foreground text-center">
                Sign in to save your profile details.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Height</Label>
                    <Input value={profile.height} onChange={e => setProfile({...profile, height: e.target.value})} placeholder="e.g. 180cm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Birthday</Label>
                    <Input type="date" value={profile.birthday} onChange={e => setProfile({...profile, birthday: e.target.value})} />
                  </div>
                  {profile.birthday && (
                    <div className="space-y-1">
                      <Label className="text-xs">Age</Label>
                      <Input readOnly value={calculateAge(profile.birthday)} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Current Weight</Label>
                    <Input value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} placeholder="e.g. 80kg" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Goal Weight</Label>
                    <Input value={profile.goalWeight} onChange={e => setProfile({...profile, goalWeight: e.target.value})} placeholder="e.g. 75kg" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sex/Gender</Label>
                  <Select 
                    value={profile.sex}
                    onValueChange={(val) => setProfile({...profile, sex: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex/gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    These numbers may be used to calculate training metrics, pace estimates, and other app insights.
                  </p>
                </div>
                <Button onClick={saveProfile} disabled={saving} className="w-full bg-maroon hover:bg-maroon-light text-white">
                  <Save className="mr-2" size={16} />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* 3. App Settings */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm no-print">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="text-gold" size={20} />
                Units
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Weight Unit</Label>
                <Select value={appSettings.weightUnit} onValueChange={(val) => setAppSettings({...appSettings, weightUnit: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lbs">lbs</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Height Unit</Label>
                <Select value={appSettings.heightUnit} onValueChange={(val) => setAppSettings({...appSettings, heightUnit: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">in</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="ft+in">ft+in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Distance Unit</Label>
                <Select value={appSettings.distanceUnit} onValueChange={(val) => setAppSettings({...appSettings, distanceUnit: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="miles">miles</SelectItem>
                    <SelectItem value="km">km</SelectItem>
                    <SelectItem value="meters">meters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm no-print">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="text-gold" size={20} />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-border flex-shrink-0"
                    style={{ backgroundColor: appSettings.primaryColor }}
                  />
                  <Select value={appSettings.primaryColor} onValueChange={(val) => {
                    const preset = THEME_PRESETS.find(p => p.primary === val);
                    const newSecondary = preset?.secondaryOptions[0].value || val;
                    setAppSettings({...appSettings, primaryColor: val, secondaryColor: newSecondary});
                  }}>
                    <SelectTrigger>
                      <SelectValue>
                        {THEME_PRESETS.find(p => p.primary === appSettings.primaryColor)?.name || appSettings.primaryColor}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_PRESETS.map(preset => (
                        <SelectItem key={preset.primary} value={preset.primary}>{preset.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-border flex-shrink-0"
                    style={{ backgroundColor: appSettings.secondaryColor }}
                  />
                  <Select value={appSettings.secondaryColor} onValueChange={(val) => {
                    setAppSettings({...appSettings, secondaryColor: val});
                  }}>
                    <SelectTrigger>
                      <SelectValue>
                        {THEME_PRESETS
                          .find(p => p.primary === appSettings.primaryColor)
                          ?.secondaryOptions
                          .find(o => o.value === appSettings.secondaryColor)
                          ?.label || appSettings.secondaryColor}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_PRESETS.find(p => p.primary === appSettings.primaryColor)?.secondaryOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveAppSettings} disabled={saving} className="w-full bg-gold hover:bg-gold-light text-white">
                <Save className="mr-2" size={16} />
                {saving ? 'Saving...' : 'Save App Settings'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Export Workouts */}
        <Card className="border-border shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="text-muted-foreground" size={20} />
              Export Workouts
            </CardTitle>
            <CardDescription>Download your workout history as CSV or JSON.</CardDescription>
          </CardHeader>
          <CardContent>
            <Export embedded />
          </CardContent>
        </Card>

        {/* Roadmap & Backlog */}
        <Card className="border-border shadow-sm md:col-span-2 no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="text-muted-foreground" size={20} />
              Roadmap & Backlog
            </CardTitle>
            <CardDescription>Features and improvements that are planned or under consideration.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {ROADMAP_ITEMS.map(section => (
                <div key={section.category}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{section.category}</h4>
                  <ul className="space-y-1.5 text-sm text-foreground">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. Application Info */}
        <Card className="border-border shadow-sm md:col-span-2 no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="text-muted-foreground" size={20} />
              Application Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg border border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Version</p>
                <p className="text-sm font-semibold text-foreground">{APP_VERSION}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg border border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Environment</p>
                <p className="text-sm font-semibold text-foreground">Production (Cloud)</p>
              </div>
              <div className="p-4 bg-muted rounded-lg border border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm font-semibold text-foreground">April 2026</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
