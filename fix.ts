import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix conflicting classes from previous sed/replace script
  content = content.replace(/className="(.*?)border-border (card-hero|card-muted|soft-panel|card-shell)(.*?)"/g, `className="$1$2$3"`);
  content = content.replace(/bg-card p-4 rounded-lg border card-shell/g, `card-shell p-4 rounded-lg`);
  content = content.replace(/border card-shell/g, `card-shell`);
  content = content.replace(/className="card-shell overflow-hidden bg-card"/g, `className="card-shell"`);
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
