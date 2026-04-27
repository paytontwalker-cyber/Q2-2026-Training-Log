import fs from 'fs';

const files = [
  'src/pages/Progress.tsx',
  'src/pages/Split.tsx',
  'src/pages/Home.tsx',
  'src/pages/Programming.tsx',
  'src/pages/ProfileSettings.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/border-border/g, 'border-maroon/30');
  fs.writeFileSync(file, content);
}

console.log("Updated borders.");
