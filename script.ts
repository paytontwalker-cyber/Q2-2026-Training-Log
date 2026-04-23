import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/data/exercises.json', 'utf8'));

const filtered = data.filter((ex: any) => ex.id !== 'c2' && ex.id !== 'bi4');

const RENAME_MAP: Record<string, string> = {
  'c1': 'Flat Barbell Bench Press',
  'c14': 'Low to High Cable Flyes',
  't2': 'Single Arm Cable Pushdowns',
  't8': 'Close Grip Bench Press',
  'f4': 'Behind the Back Wrist Curls',
  'ub3': 'Chest Supported Row',
  'ub5': 'T Bar Row',
  'ub9': 'Iso Lateral Machine Rows',
  'ub10': 'Iso Lateral Low Rows',
  'la1': 'Pull Ups',
  'la2': 'Chin Ups',
  'la4': 'Single Arm Lat Pulldown',
  'la5': 'Straight Arm Pulldown',
  'lb5': '45 Degree Back Extension',
  'q13': 'Step Ups',
  'ha4': 'Single Leg Curls',
  'ha7': 'Stiff Leg Deadlift',
  'ha9': 'Cable Pull Throughs',
  'ca5': 'Single Leg Calf Raises',
  'co4': 'Decline Sit Ups',
  'co5': 'Weighted Sit Ups',
  'co6': 'GHD Sit Ups',
};

const updated = filtered.map((ex: any) => {
  if (RENAME_MAP[ex.id]) {
    return { ...ex, name: RENAME_MAP[ex.id] };
  }
  return ex;
});

fs.writeFileSync('src/data/exercises.json', JSON.stringify(updated, null, 2));

console.log('Done, length: ', updated.length);
