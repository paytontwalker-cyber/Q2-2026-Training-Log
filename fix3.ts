import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src/pages');
const componentsDir = path.join(process.cwd(), 'src/components');

function replaceInDir(dirPath: string) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/className="bg-maroon hover:bg-maroon-light text-white/g, `className="btn-primary`);
      content = content.replace(/className="(.+?) bg-maroon hover:bg-maroon-light text-white/g, `className="$1 btn-primary`);
      content = content.replace(/bg-maroon hover:bg-maroon-light text-white/g, `btn-primary`);
      
      fs.writeFileSync(fullPath, content);
      console.log(`Updated ${file}`);
    }
  }
}

replaceInDir(pagesDir);
replaceInDir(componentsDir);
