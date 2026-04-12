import { LayoutDashboard, Calendar, Dumbbell, LineChart, History as HistoryIcon, Users, UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home({ setCurrentPage }: { setCurrentPage: (page: any) => void }) {
  const navItems = [
    { id: 'split', label: 'Split', icon: Calendar, description: 'Manage your weekly workout split' },
    { id: 'exercises', label: 'Exercises', icon: Dumbbell, description: 'View and manage your exercise library' },
    { id: 'log', label: 'Daily Log', icon: LayoutDashboard, description: 'Log your daily workout' },
    { id: 'progress', label: 'Progress', icon: LineChart, description: 'Track your training data' },
    { id: 'history', label: 'History', icon: HistoryIcon, description: 'View past workouts' },
    { id: 'social', label: 'Social', icon: Users, description: 'Connect with training partners' },
    { id: 'profile', label: 'Profile & Settings', icon: UserCircle, description: 'Manage your account' },
  ];

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">What are you training today?</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navItems.map((item) => (
          <Card 
            key={item.id} 
            className="cursor-pointer hover:shadow-md transition-shadow border-border"
            onClick={() => setCurrentPage(item.id)}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="p-2 bg-maroon/10 rounded-lg text-maroon">
                <item.icon size={24} />
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
