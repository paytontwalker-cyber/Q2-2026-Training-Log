import { LayoutDashboard, Dumbbell, LineChart, History as HistoryIcon, Users, UserCircle, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home({ setCurrentPage }: { setCurrentPage: (page: any) => void }) {
  const navItems = [
    { id: 'log', label: 'Daily Log', icon: LayoutDashboard, description: 'Log your daily workout' },
    { id: 'programming', label: 'Programming', icon: Dumbbell, description: 'Manage your workout programs and exercise library' },
    { id: 'progress', label: 'Progress', icon: LineChart, description: 'Track your training data' },
    { id: 'history', label: 'History', icon: HistoryIcon, description: 'Review past workouts' },
    { id: 'wellness', label: 'Health / Wellness', icon: Activity, description: 'Explore future wellness and recovery tracking' },
    { id: 'social', label: 'Social', icon: Users, description: 'Connect with training partners' },
    { id: 'profile', label: 'Profile & Settings', icon: UserCircle, description: 'Manage your account and app preferences' },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-4xl font-bold tracking-tight text-foreground">Welcome back!</h2>
        <p className="text-muted-foreground mt-1">What are you training today?</p>
      </header>

      <Card className="card-hero border-border">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div>
              <div className="label-micro mb-1">Today</div>
              <h3 className="text-2xl font-bold text-foreground">{today}</h3>
              <p className="text-muted-foreground text-sm">Ready to crush your goals.</p>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/3 progress-gradient rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navItems.map((item) => (
          <Card 
            key={item.id} 
            className="cursor-pointer hover:shadow-md transition-shadow border-border card-hero"
            onClick={() => setCurrentPage(item.id)}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="p-2 bg-primary/5 rounded-lg text-maroon">
                <item.icon size={28} />
              </div>
              <CardTitle className="text-lg">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
