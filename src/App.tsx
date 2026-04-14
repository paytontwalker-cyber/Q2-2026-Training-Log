/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  Dumbbell, 
  History as HistoryIcon, 
  Calendar, 
  Menu,
  X,
  LogOut,
  LogIn,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Users,
  Activity,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_VERSION } from './constants';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { Button } from '@/components/ui/button';
import Home from './pages/Home';
import DailyLog from './pages/DailyLog';
import Progress from './pages/Progress';
import History from './pages/History';
import Programming from './pages/Programming';
import ProfileSettings from './pages/ProfileSettings';
import Social from './pages/Social';
import Wellness from './pages/Wellness';

type Page = 'home' | 'log' | 'progress' | 'history' | 'programming' | 'profile' | 'social' | 'wellness';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedBuckets, setExpandedBuckets] = useState<Record<string, boolean>>({
    train: true,
    analyze: true,
    social: true,
    settings: true,
  });
  const { user, loading, login, loginAsGuest, logout, signUpWithEmail, signInWithEmail } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuth = async () => {
    setAuthError(null);
    try {
      if (isCreatingAccount) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error: any) {
      let message = 'An error occurred during authentication.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'This email is already in use.';
          break;
        case 'auth/invalid-email':
          message = 'Enter a valid email address.';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak.';
          break;
        case 'auth/user-not-found':
          message = 'No account found with that email.';
          break;
        case 'auth/wrong-password':
          message = 'Wrong password.';
          break;
        case 'auth/invalid-credential':
          message = 'Invalid email or password.';
          break;
        case 'auth/operation-not-allowed':
          message = 'Email/password sign-in is not enabled in Firebase Authentication yet.';
          break;
        default:
          message = `Authentication failed: ${error.message}`;
      }
      setAuthError(message);
    }
  };
  const isGuest = user && 'isGuest' in user;

  // Auto-expand bucket containing active page
  useEffect(() => {
    const activeBucket = navBuckets.find(b => b.items.some(i => i.id === currentPage));
    if (activeBucket) {
      setExpandedBuckets(prev => ({ ...prev, [activeBucket.id]: true }));
    }
  }, [currentPage]);

  const toggleAuthMode = () => {
    setIsCreatingAccount(!isCreatingAccount);
    setAuthError(null);
  };

  const toggleBucket = (id: string) => {
    setExpandedBuckets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const navBuckets = [
    {
      id: 'train',
      label: 'Train',
      items: [
        { id: 'log', label: 'Daily Log', icon: LayoutDashboard },
        { id: 'programming', label: 'Programming', icon: Dumbbell },
      ],
    },
    {
      id: 'analyze',
      label: 'Analyze',
      items: [
        { id: 'progress', label: 'Progress', icon: LineChart },
        { id: 'history', label: 'History', icon: HistoryIcon },
        { id: 'wellness', label: 'Health / Wellness', icon: Activity },
      ],
    },
    {
      id: 'social',
      label: 'Social',
      items: [
        { id: 'social', label: 'Social', icon: Users },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      items: [
        { id: 'profile', label: 'Profile & Settings', icon: UserCircle },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card text-card-foreground rounded-2xl shadow-xl p-8 text-center space-y-6 border border-border">
          <h1 className="text-4xl font-bold text-maroon tracking-tight">
            TRAINING<span className="text-gold">LOG</span>
          </h1>
          <p className="text-muted-foreground">
            A clean, structured workout logging app for hybrid strength and conditioning athletes.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={login} 
              className="w-full bg-maroon hover:bg-maroon-light text-white h-12 text-lg"
            >
              <LogIn className="mr-2" size={20} />
              Sign in with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              />
              {authError && <p className="text-destructive text-sm">{authError}</p>}
              <Button 
                onClick={handleAuth}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10"
              >
                {isCreatingAccount ? 'Create Account' : 'Sign In'}
              </Button>
              <button 
                onClick={toggleAuthMode}
                className="w-full text-sm text-muted-foreground hover:text-maroon underline"
              >
                {isCreatingAccount ? 'Already have an account? Sign In' : 'Need an account? Create one'}
              </button>
            </div>

            <Button 
              onClick={loginAsGuest} 
              variant="outline"
              className="w-full border-border text-muted-foreground h-12 text-lg"
            >
              Continue as Guest
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home setCurrentPage={setCurrentPage} />;
      case 'log': return <DailyLog />;
      case 'progress': return <Progress />;
      case 'history': return <History setCurrentPage={setCurrentPage} />;
      case 'programming': return <Programming />;
      case 'social': return <Social />;
      case 'profile': return <ProfileSettings />;
      case 'wellness': return <Wellness />;
      default: return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar / Navigation */}
      <nav className={cn(
        "bg-card border-r border-border flex-shrink-0 z-50 transition-all duration-300 flex flex-col",
        // Mobile styles
        "fixed left-0 top-0 h-dvh w-[280px] max-w-[85vw] shadow-xl",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop styles
        "md:relative md:h-auto md:w-auto md:translate-x-0 md:shadow-none",
        isSidebarCollapsed ? "md:w-20" : "md:w-64"
      )}>
        {/* Collapse Toggle Button (Desktop Only) */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex absolute -right-3 top-20 bg-card border border-border rounded-full p-1 shadow-sm text-muted-foreground hover:text-maroon z-50"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={cn(
          "flex items-center justify-between border-b border-border",
          "px-4 py-4 md:p-6",
          isSidebarCollapsed && "md:p-4 md:justify-center"
        )}>
          <h1 className={cn(
            "text-2xl font-bold text-maroon tracking-tight transition-all",
            isSidebarCollapsed && "md:text-lg"
          )}>
            {isSidebarCollapsed ? (
              <span className="md:hidden">TRAINING<span className="text-gold">LOG</span></span>
            ) : (
              <>TRAINING<span className="text-gold">LOG</span></>
            )}
            {isSidebarCollapsed && <span className="hidden md:inline">T<span className="text-gold">L</span></span>}
          </h1>
          <button 
            className="md:hidden p-2 -mr-2 text-muted-foreground"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-3 md:py-4 flex flex-col">
          <div className="flex-1 px-3 md:px-0 space-y-4 md:space-y-6">
            {/* Home Item */}
            <button
              onClick={() => {
                setCurrentPage('home');
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 py-2 text-sm transition-colors relative",
                "px-4 rounded-md md:px-6 md:rounded-none",
                isSidebarCollapsed && "md:px-0 md:justify-center",
                currentPage === 'home' 
                  ? "text-foreground font-semibold bg-accent before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-maroon" 
                  : "text-muted-foreground font-medium hover:text-foreground hover:bg-muted"
              )}
            >
              <LayoutDashboard size={18} className={currentPage === 'home' ? "text-maroon" : "text-muted-foreground"} />
              <span className={cn(
                "transition-opacity duration-300",
                isSidebarCollapsed && "md:hidden"
              )}>
                Home
              </span>
            </button>

            {navBuckets.map((bucket, index) => (
              <div key={bucket.id} className={cn(index > 0 && "border-t border-border pt-4 mt-4")}>
                {!isSidebarCollapsed && (
                  <button 
                    onClick={() => toggleBucket(bucket.id)}
                    className="w-full flex items-center justify-between px-4 label-micro mb-2 hover:text-foreground"
                  >
                    {bucket.label}
                    <ChevronDown size={12} className={cn("transition-transform", expandedBuckets[bucket.id] ? "" : "-rotate-90")} />
                  </button>
                )}
                {expandedBuckets[bucket.id] && (
                  <div className="space-y-1">
                    {bucket.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentPage(item.id as Page);
                          setIsMobileMenuOpen(false);
                        }}
                        title={isSidebarCollapsed ? item.label : undefined}
                        className={cn(
                          "w-full flex items-center gap-3 py-2 text-sm transition-colors relative",
                          "px-4 rounded-md md:px-6 md:rounded-none",
                          isSidebarCollapsed && "md:px-0 md:justify-center",
                          currentPage === item.id 
                            ? "text-foreground font-semibold bg-accent before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-maroon" 
                            : "text-muted-foreground font-medium hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon size={18} className={currentPage === item.id ? "text-maroon" : "text-muted-foreground"} />
                        <span className={cn(
                          "transition-opacity duration-300",
                          isSidebarCollapsed && "md:hidden"
                        )}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="px-4 py-3 md:px-6 md:py-4 border-t border-border space-y-4 mt-auto">
            <button
              onClick={logout}
              className={cn(
                "w-full flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors",
                isSidebarCollapsed && "md:justify-center"
              )}
            >
              <LogOut size={20} />
              <span className={cn(isSidebarCollapsed && "md:hidden")}>Sign Out</span>
            </button>
            <div className={cn(
              "text-xs text-muted-foreground",
              isSidebarCollapsed && "md:hidden"
            )}>
              v{APP_VERSION}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-bold text-maroon tracking-tight">
          TRAINING<span className="text-gold">LOG</span>
        </h1>
        <button 
          className="p-2 text-muted-foreground"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-background">
        <div className="max-w-5xl mx-auto">
          {isGuest && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-center gap-2 text-amber-800 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Guest Mode - data will not be saved to the cloud
            </div>
          )}
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </FirebaseProvider>
  );
}
