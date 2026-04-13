import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Split from './Split';
import Exercises from './Exercises';
import AIBuilder from './AIBuilder';

export default function Programming() {
  const [activeTab, setActiveTab] = useState<'programs' | 'exercises' | 'ai'>('exercises');

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
          variant={activeTab === 'programs' ? 'default' : 'outline'}
          onClick={() => setActiveTab('programs')}
          className={cn(
            "rounded-full px-6",
            activeTab === 'programs' ? "bg-maroon hover:bg-maroon-light text-white" : "text-slate-600"
          )}
        >
          Programs
        </Button>
        <Button
          variant={activeTab === 'ai' ? 'default' : 'outline'}
          onClick={() => setActiveTab('ai')}
          className={cn(
            "rounded-full px-6",
            activeTab === 'ai' ? "bg-maroon hover:bg-maroon-light text-white" : "text-slate-600"
          )}
        >
          AI Program Builder
        </Button>
      </div>

      <div className="mt-6">
        {activeTab === 'exercises' ? <Exercises /> : activeTab === 'programs' ? <Split /> : <AIBuilder />}
      </div>
    </div>
  );
}
