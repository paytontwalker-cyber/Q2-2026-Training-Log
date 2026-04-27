import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function Wellness() {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h2 className="page-title">Health / Wellness</h2>
          <p className="page-subtitle">Future recovery, sleep, nutrition, and wellness tracking.</p>
        </div>
      </header>

      <Card className="card-shell">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="text-maroon" size={20} />
            Coming Soon
          </CardTitle>
          <CardDescription>We are building out tools to help you track your overall health and recovery.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Sleep</li>
            <li>Nutrition</li>
            <li>Recovery</li>
            <li>Wellness trends</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
