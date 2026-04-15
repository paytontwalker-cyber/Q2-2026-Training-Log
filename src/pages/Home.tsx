import { LayoutDashboard, Dumbbell, LineChart, History as HistoryIcon, Users, UserCircle, Activity, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/src/lib/hooks';
import { BodyMap } from '@/src/components/BodyMap';
import { MUSCLE_VOLUME_TARGETS } from '@/src/constants';
import { format } from 'date-fns';

export default function Home({ setCurrentPage }: { setCurrentPage: (page: any) => void }) {
  const { weeklyVolume, recentPRs, recentActivity, loading } = useDashboardData();
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">{today}</p>
      </header>

      {/* Weekly Volume Visualizer */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Weekly Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <BodyMap muscleGroupData={Object.entries<number>(weeklyVolume).map(([name, value]) => ({ name, value }))} />
        </CardContent>
      </Card>

      {/* Today's Session Card */}
      <Card className="border-border bg-maroon text-white">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Today's Session</h3>
            <p className="text-maroon-light">Ready to crush your goals.</p>
          </div>
          <Button onClick={() => setCurrentPage('log')} variant="secondary">
            Start Logging <ChevronRight size={16} />
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent PRs */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Recent PRs</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentPRs.map((pr, i) => (
                <li key={i} className="flex justify-between">
                  <span>{pr.name}</span>
                  <span className="font-bold">{pr.weight} kg</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentActivity.map((w, i) => (
                <li key={i} className="flex justify-between">
                  <span>{w.workoutName}</span>
                  <span>{format(new Date(w.date), 'MMM d')}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
