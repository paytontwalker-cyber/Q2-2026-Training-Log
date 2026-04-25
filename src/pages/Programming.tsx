import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Split from './Split';
import Exercises from './Exercises';
import AIBuilder from './AIBuilder';

export default function Programming() {
  const [activeTab, setActiveTab] = useState<'programs' | 'exercises' | 'ai'>('exercises');

  return (
    <div className="page-shell content-start">
      <header className="page-header">
        <div>
          <h2 className="page-title">Programming</h2>
          <p className="page-subtitle">Manage your workout splits and exercise library.</p>
        </div>
      </header>

      <div className="flex bg-card p-1 rounded-xl border border-border w-fit overflow-x-auto max-w-full shadow-sm mb-6">
        <button
          onClick={() => setActiveTab('exercises')}
          className={cn(
            "px-4 py-2 text-xs font-bold transition-all rounded-lg whitespace-nowrap",
            activeTab === 'exercises' ? "bg-maroon text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Exercises
        </button>
        <button
          onClick={() => setActiveTab('programs')}
          className={cn(
            "px-4 py-2 text-xs font-bold transition-all rounded-lg whitespace-nowrap",
            activeTab === 'programs' ? "bg-maroon text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Programs
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={cn(
            "px-4 py-2 text-xs font-bold transition-all rounded-lg whitespace-nowrap",
            activeTab === 'ai' ? "bg-maroon text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          AI Program Builder
        </button>
      </div>

      <div className="mt-2">
        {activeTab === 'exercises' ? <Exercises /> : activeTab === 'programs' ? <Split /> : <AIBuilder />}
      </div>
    </div>
  );
}
