import fs from 'fs';

const file = 'src/pages/Progress.tsx';
let content = fs.readFileSync(file, 'utf-8');

const search = "contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}";
const replace = "contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)' }}";

content = content.split(search).join(replace);

fs.writeFileSync(file, content, 'utf-8');
console.log('Fixed Tooltips');
