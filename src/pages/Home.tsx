import { LayoutDashboard, Dumbbell, LineChart, Users, HeartPulse, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/src/lib/hooks';
import { BodyMap } from '@/src/components/BodyMap';
import { format } from 'date-fns';

export default function Home({ setCurrentPage }: { setCurrentPage: (page: any) => void }) {
  const { weeklyVolume, recentPRs, recentActivity, loading } = useDashboardData();
  
  const today = format(new Date(), 'EEEE, MMMM d');

  const navItems = [
    { id: 'log', label: 'Daily Log', icon: LayoutDashboard },
    { id: 'programming', label: 'Programming', icon: Dumbbell },
    { id: 'progress', label: 'Progress', icon: LineChart },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'wellness', label: 'Wellness', icon: HeartPulse },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Top Section: Date & Activity Header */}
      <header className="py-4">
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1 font-medium">{today}</p>
      </header>

      {/* 2. Navigation Hub */}
      <div className="grid grid-cols-3 gap-3">
        {navItems.map((item) => (
          <Button 
            key={item.id} 
            variant="outline" 
            className="h-auto py-3 flex flex-col gap-1.5 border-border hover:border-maroon hover:text-maroon"
            onClick={() => setCurrentPage(item.id)}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-semibold uppercase">{item.label}</span>
          </Button>
        ))}
      </div>

      {/* 3. Performance Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader><CardTitle className="text-lg">Recent PRs</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentPRs.map((pr, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{pr.name}</span>
                  <span className="font-bold text-maroon">{pr.weight} kg</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentActivity.map((w, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{w.workoutName}</span>
                  <span className="text-muted-foreground">{format(new Date(w.date), 'MMM d')}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 4. Bottom Section: Muscle Heatmap */}
      <Card className="border-border">
        <CardHeader><CardTitle className="text-lg">Weekly Training Intensity</CardTitle></CardHeader>
        <CardContent>
          <BodyMap muscleGroupData={Object.entries<number>(weeklyVolume).map(([name, value]) => ({ name, value }))} />
        </CardContent>
      </Card>
    </div>
  );
}
