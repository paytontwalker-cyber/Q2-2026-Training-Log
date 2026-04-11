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
  Download,
  Menu,
  X,
  LogOut,
  LogIn,
  ChevronLeft,
  ChevronRight,
  UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_VERSION } from './constants';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { Button } from '@/components/ui/button';
import Home from './pages/Home';
import DailyLog from './pages/DailyLog';
import Progress from './pages/Progress';
import Exercises from './pages/Exercises';
import History from './pages/History';
import Split from './pages/Split';
import Export from './pages/Export';
import ProfileSettings from './pages/ProfileSettings';

type Page = 'home' | 'log' | 'progress' | 'exercises' | 'history' | 'split' | 'export' | 'profile';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, loading, login, loginAsGuest, logout } = useFirebase();
  const isGuest = user && 'isGuest' in user;

  const navItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'split', label: 'Split', icon: Calendar },
    { id: 'exercises', label: 'Exercises', icon: Dumbbell },
    { id: 'log', label: 'Daily Log', icon: LayoutDashboard },
    { id: 'progress', label: 'Progress', icon: LineChart },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'profile', label: 'Profile & Settings', icon: UserCircle },
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
      case 'exercises': return <Exercises />;
      case 'history': return <History setCurrentPage={setCurrentPage} />;
      case 'split': return <Split />;
      case 'export': return <Export />;
      case 'profile': return <ProfileSettings />;
      default: return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar / Navigation */}
      <nav className={cn(
        "bg-card border-r border-border flex-shrink-0 z-50 transition-all duration-300 relative",
        isSidebarCollapsed ? "md:w-20" : "md:w-64",
        "fixed md:relative",
        isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Collapse Toggle Button (Desktop Only) */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex absolute -right-3 top-20 bg-card border border-border rounded-full p-1 shadow-sm text-muted-foreground hover:text-maroon z-50"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={cn(
          "p-6 border-b border-border flex items-center justify-between",
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
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="py-4 flex flex-col h-[calc(100%-88px)]">
          <div className="flex-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as Page);
                  setIsMobileMenuOpen(false);
                }}
                title={isSidebarCollapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors",
                  isSidebarCollapsed && "md:px-0 md:justify-center",
                  currentPage === item.id 
                    ? "text-maroon bg-maroon/5 border-r-4 border-maroon" 
                    : "text-muted-foreground hover:text-maroon hover:bg-muted"
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
          
          <div className="px-6 py-4 border-t border-border space-y-4">
            <button
              onClick={logout}
              className={cn(
                "w-full flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors",
                isSidebarCollapsed && "md:justify-center"
              )}
            >
              <LogOut size={20} />
              {!isSidebarCollapsed && <span>Sign Out</span>}
            </button>
            {!isSidebarCollapsed && (
              <div className="text-xs text-muted-foreground">
                v{APP_VERSION}
              </div>
            )}
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
