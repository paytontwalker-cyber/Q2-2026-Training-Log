import fs from 'fs';

let text = fs.readFileSync('src/data/templates.json', 'utf8');

text = text.replace(/Pull-Ups/g, 'Pull Ups');
text = text.replace(/Pull-Up/g, 'Pull Ups');
text = text.replace(/Flat Bench Press/g, 'Flat Barbell Bench Press');
text = text.replace(/(?<!Incline )(?<!Flat )Barbell Bench Press/g, 'Flat Barbell Bench Press');
text = text.replace(/Chest-Supported Row/g, 'Chest Supported Row');
text = text.replace(/Iso-Lateral Machine Rows/g, 'Iso Lateral Machine Rows');
text = text.replace(/ISO Lateral Low Rows/g, 'Iso Lateral Low Rows');
text = text.replace(/(?<!Seated )Incline DB Curls/g, 'Seated Incline DB Curls');

fs.writeFileSync('src/data/templates.json', text);

JSON.parse(text); // verify parsing
console.log('Done templates.json');
