import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // multiline replace for DailyLog and Split
  content = content.replace(/"border-border shadow-sm/g, `"card-shell`);
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
