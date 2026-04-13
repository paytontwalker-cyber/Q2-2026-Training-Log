import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Split from './Split';
import Exercises from './Exercises';

export default function Programming() {
  const [activeTab, setActiveTab] = useState<'split' | 'exercises'>('exercises');

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Programming</h2>
        <p className="text-slate-500">Manage your workout splits and exercise library.</p>
      </header>

      <div className="flex gap-2">
        <Button
          variant={activeTab === 'exercises' ? 'default' : 'outline'}
          onClick={() => setActiveTab('exercises')}
          className={cn(
            "rounded-full px-6",
            activeTab === 'exercises' ? "bg-maroon hover:bg-maroon-light text-white" : "text-slate-600"
          )}
        >
          Exercises
        </Button>
        <Button
          variant={activeTab === 'split' ? 'default' : 'outline'}
          onClick={() => setActiveTab('split')}
          className={cn(
            "rounded-full px-6",
            activeTab === 'split' ? "bg-maroon hover:bg-maroon-light text-white" : "text-slate-600"
          )}
        >
          Split
        </Button>
      </div>

      <div className="mt-6">
        {activeTab === 'exercises' ? <Exercises /> : <Split />}
      </div>
    </div>
  );
}
