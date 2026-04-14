import fs from 'fs';

const files = [
  'src/pages/DailyLog.tsx',
  'src/pages/Progress.tsx',
  'src/pages/History.tsx',
  'src/pages/Split.tsx',
  'src/pages/Social.tsx',
  'src/pages/ProfileSettings.tsx',
  'src/pages/Export.tsx',
  'src/pages/Exercises.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-slate-50/g, 'bg-muted');
  content = content.replace(/bg-slate-100/g, 'bg-muted');
  content = content.replace(/bg-white/g, 'bg-card');
  content = content.replace(/border-slate-100/g, 'border-border');
  content = content.replace(/border-slate-200/g, 'border-border');
  content = content.replace(/border-slate-300/g, 'border-border');
  content = content.replace(/text-slate-300/g, 'text-muted-foreground');
  content = content.replace(/text-slate-400/g, 'text-muted-foreground');
  content = content.replace(/text-slate-500/g, 'text-muted-foreground');
  content = content.replace(/text-slate-600/g, 'text-muted-foreground');
  content = content.replace(/text-slate-700/g, 'text-foreground');
  content = content.replace(/text-slate-800/g, 'text-foreground');
  content = content.replace(/text-slate-900/g, 'text-foreground');
  content = content.replace(/ring-slate-200/g, 'ring-border');
  content = content.replace(/hover:bg-slate-50/g, 'hover:bg-accent');
  fs.writeFileSync(file, content);
});
