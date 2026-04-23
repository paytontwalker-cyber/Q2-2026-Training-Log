import fs from 'fs';

const exercisesData = JSON.parse(fs.readFileSync('src/data/exercises.json', 'utf8'));

// C: Updates
const c_updates: Record<string, any[]> = {
  "s8": [{"group":"Side Delts","percent":45},{"group":"Traps","percent":40},{"group":"Shoulders","percent":15}],
  "gl5": [{"group":"Quads","percent":30},{"group":"Glutes","percent":30},{"group":"Hamstrings","percent":20},{"group":"Lower Back","percent":20}],
  "fu1": [{"group":"Functional","percent":40},{"group":"Forearms","percent":25},{"group":"Traps","percent":20},{"group":"Core","percent":15}],
  "lb1": [{"group":"Lower Back","percent":25},{"group":"Hamstrings","percent":25},{"group":"Glutes","percent":25},{"group":"Upper Back","percent":15},{"group":"Forearms","percent":10}]
};

// D: Updates
const d_updates: Record<string, any[]> = {
  "co1": [{"group":"Core","percent":60},{"group":"Hip Flexors","percent":40}],
  "co4": [{"group":"Core","percent":65},{"group":"Hip Flexors","percent":35}],
  "co5": [{"group":"Core","percent":70},{"group":"Hip Flexors","percent":30}],
  "co6": [{"group":"Core","percent":55},{"group":"Hip Flexors","percent":45}],
  "co9": [{"group":"Core","percent":85},{"group":"Hip Flexors","percent":15}],
  "co11": [{"group":"Core","percent":70},{"group":"Hip Flexors","percent":30}],
  "q8": [{"group":"Quads","percent":45},{"group":"Glutes","percent":30},{"group":"Hamstrings","percent":10},{"group":"Hip Flexors","percent":10},{"group":"Core","percent":5}],
  "q9": [{"group":"Quads","percent":40},{"group":"Glutes","percent":25},{"group":"Core","percent":20},{"group":"Hamstrings","percent":10},{"group":"Hip Flexors","percent":5}],
  "q10": [{"group":"Quads","percent":45},{"group":"Glutes","percent":25},{"group":"Hip Flexors","percent":10},{"group":"Hamstrings","percent":10},{"group":"Core","percent":10}],
  "q11": [{"group":"Quads","percent":45},{"group":"Glutes","percent":25},{"group":"Hip Flexors","percent":10},{"group":"Hamstrings","percent":10},{"group":"Core","percent":10}],
  "q12": [{"group":"Quads","percent":40},{"group":"Glutes","percent":30},{"group":"Hip Flexors","percent":10},{"group":"Hamstrings","percent":10},{"group":"Core","percent":10}],
  "q13": [{"group":"Quads","percent":45},{"group":"Glutes","percent":30},{"group":"Hip Flexors","percent":10},{"group":"Hamstrings","percent":10},{"group":"Core","percent":5}]
};

const newExercises = [
  { id: "c17", name: "Push Ups", muscleGroup: "Chest", trackingMode: "reps", muscleDistribution: [{group:"Chest",percent:55},{group:"Triceps",percent:25},{group:"Shoulders",percent:15},{group:"Core",percent:5}] },
  { id: "c18", name: "Cable Crossover", muscleGroup: "Chest", trackingMode: "reps", muscleDistribution: [{group:"Chest",percent:85},{group:"Shoulders",percent:15}] },
  { id: "c19", name: "Svend Press", muscleGroup: "Chest", trackingMode: "reps", muscleDistribution: [{group:"Chest",percent:80},{group:"Shoulders",percent:15},{group:"Triceps",percent:5}] },
  { id: "ub11", name: "Meadows Row", muscleGroup: "Upper Back", trackingMode: "reps", muscleDistribution: [{group:"Upper Back",percent:50},{group:"Lats",percent:35},{group:"Rear Delts",percent:15}] },
  { id: "ub12", name: "Kroc Row", muscleGroup: "Upper Back", trackingMode: "reps", muscleDistribution: [{group:"Upper Back",percent:40},{group:"Lats",percent:40},{group:"Forearms",percent:10},{group:"Rear Delts",percent:10}] },
  { id: "ub13", name: "Landmine Row", muscleGroup: "Upper Back", trackingMode: "reps", muscleDistribution: [{group:"Upper Back",percent:50},{group:"Lats",percent:35},{group:"Rear Delts",percent:15}] },
  { id: "ub14", name: "Inverted Row", muscleGroup: "Upper Back", trackingMode: "reps", muscleDistribution: [{group:"Upper Back",percent:45},{group:"Lats",percent:30},{group:"Biceps",percent:15},{group:"Rear Delts",percent:10}] },
  { id: "la8", name: "Neutral Grip Pulldown", muscleGroup: "Lats", trackingMode: "reps", muscleDistribution: [{group:"Lats",percent:70},{group:"Biceps",percent:20},{group:"Upper Back",percent:10}] },
  { id: "s9", name: "Push Press", muscleGroup: "Shoulders", trackingMode: "reps", muscleDistribution: [{group:"Shoulders",percent:45},{group:"Triceps",percent:25},{group:"Quads",percent:15},{group:"Core",percent:15}] },
  { id: "s10", name: "Z Press", muscleGroup: "Shoulders", trackingMode: "reps", muscleDistribution: [{group:"Shoulders",percent:55},{group:"Triceps",percent:25},{group:"Core",percent:20}] },
  { id: "s11", name: "Landmine Press", muscleGroup: "Shoulders", trackingMode: "reps", muscleDistribution: [{group:"Shoulders",percent:55},{group:"Triceps",percent:20},{group:"Chest",percent:15},{group:"Core",percent:10}] },
  { id: "rd5", name: "Y Raises", muscleGroup: "Rear Delts", trackingMode: "reps", muscleDistribution: [{group:"Rear Delts",percent:60},{group:"Upper Back",percent:25},{group:"Traps",percent:15}] },
  { id: "ha10", name: "Single Leg RDL", muscleGroup: "Hamstrings", trackingMode: "reps", muscleDistribution: [{group:"Hamstrings",percent:45},{group:"Glutes",percent:30},{group:"Lower Back",percent:15},{group:"Core",percent:10}] },
  { id: "q14", name: "Reverse Lunge", muscleGroup: "Quads", trackingMode: "reps", muscleDistribution: [{group:"Quads",percent:40},{group:"Glutes",percent:35},{group:"Hamstrings",percent:10},{group:"Hip Flexors",percent:10},{group:"Core",percent:5}] },
  { id: "q15", name: "Curtsy Lunge", muscleGroup: "Glutes", trackingMode: "reps", muscleDistribution: [{group:"Glutes",percent:55},{group:"Quads",percent:25},{group:"Hip Flexors",percent:10},{group:"Core",percent:10}] },
  { id: "q16", name: "Cyclist Squat", muscleGroup: "Quads", trackingMode: "reps", muscleDistribution: [{group:"Quads",percent:80},{group:"Glutes",percent:15},{group:"Core",percent:5}] },
  { id: "q17", name: "Sissy Squat", muscleGroup: "Quads", trackingMode: "reps", muscleDistribution: [{group:"Quads",percent:90},{group:"Core",percent:10}] },
  { id: "q18", name: "Reverse Hack Squat", muscleGroup: "Hamstrings", trackingMode: "reps", muscleDistribution: [{group:"Hamstrings",percent:50},{group:"Glutes",percent:35},{group:"Quads",percent:15}] },
  { id: "q19", name: "ATG Split Squat", muscleGroup: "Quads", trackingMode: "reps", muscleDistribution: [{group:"Quads",percent:55},{group:"Glutes",percent:25},{group:"Hamstrings",percent:10},{group:"Hip Flexors",percent:10}] },
  { id: "q20", name: "Pistol Squat", muscleGroup: "Quads", trackingMode: "reps", muscleDistribution: [{group:"Quads",percent:50},{group:"Glutes",percent:25},{group:"Hamstrings",percent:10},{group:"Hip Flexors",percent:10},{group:"Core",percent:5}] },
  { id: "gl6", name: "Hip Abduction Machine", muscleGroup: "Glutes", trackingMode: "reps", muscleDistribution: [{group:"Glutes",percent:100}] },
  { id: "co13", name: "L Sit", muscleGroup: "Core", trackingMode: "time", muscleDistribution: [{group:"Core",percent:55},{group:"Hip Flexors",percent:35},{group:"Lats",percent:10}] },
  { id: "co14", name: "Dragon Flag", muscleGroup: "Core", trackingMode: "reps", muscleDistribution: [{group:"Core",percent:65},{group:"Hip Flexors",percent:25},{group:"Lats",percent:10}] },
  { id: "co15", name: "Medicine Ball Slams", muscleGroup: "Core", trackingMode: "reps", muscleDistribution: [{group:"Core",percent:70},{group:"Lats",percent:15},{group:"Shoulders",percent:15}] },
  { id: "co16", name: "Cable Woodchop", muscleGroup: "Core", trackingMode: "reps", muscleDistribution: [{group:"Core",percent:80},{group:"Hip Flexors",percent:10},{group:"Shoulders",percent:10}] },
  { id: "co17", name: "Kneeling Cable Crunch", muscleGroup: "Core", trackingMode: "reps", muscleDistribution: [{group:"Core",percent:100}] },
  { id: "co18", name: "Flutter Kicks", muscleGroup: "Core", trackingMode: "reps", muscleDistribution: [{group:"Core",percent:45},{group:"Hip Flexors",percent:55}] },
  { id: "fu7", name: "Kettlebell Swing", muscleGroup: "Functional", trackingMode: "reps", muscleDistribution: [{group:"Glutes",percent:35},{group:"Hamstrings",percent:25},{group:"Core",percent:20},{group:"Functional",percent:10},{group:"Lower Back",percent:10}] },
  { id: "fu8", name: "Kettlebell Snatch", muscleGroup: "Functional", trackingMode: "reps", muscleDistribution: [{group:"Functional",percent:30},{group:"Glutes",percent:25},{group:"Shoulders",percent:20},{group:"Hamstrings",percent:15},{group:"Core",percent:10}] },
  { id: "fu9", name: "Kettlebell Clean", muscleGroup: "Functional", trackingMode: "reps", muscleDistribution: [{group:"Functional",percent:30},{group:"Glutes",percent:25},{group:"Upper Back",percent:15},{group:"Hamstrings",percent:15},{group:"Core",percent:15}] },
  { id: "fu10", name: "Yoke Carry", muscleGroup: "Functional", trackingMode: "distance", muscleDistribution: [{group:"Functional",percent:35},{group:"Traps",percent:25},{group:"Core",percent:20},{group:"Quads",percent:20}] },
  { id: "fu11", name: "Zercher Carry", muscleGroup: "Functional", trackingMode: "distance", muscleDistribution: [{group:"Functional",percent:35},{group:"Core",percent:30},{group:"Upper Back",percent:20},{group:"Biceps",percent:15}] },
  { id: "fu12", name: "Bear Crawl", muscleGroup: "Functional", trackingMode: "time", muscleDistribution: [{group:"Functional",percent:35},{group:"Core",percent:30},{group:"Shoulders",percent:20},{group:"Hip Flexors",percent:15}] },
  { id: "fu13", name: "Turkish Get Up", muscleGroup: "Functional", trackingMode: "reps", muscleDistribution: [{group:"Functional",percent:30},{group:"Core",percent:25},{group:"Shoulders",percent:20},{group:"Glutes",percent:15},{group:"Hip Flexors",percent:10}] },
  { id: "pl5", name: "Depth Jumps", muscleGroup: "Plyos", trackingMode: "reps", muscleDistribution: [{group:"Plyos",percent:55},{group:"Quads",percent:25},{group:"Glutes",percent:20}] },
  { id: "pl6", name: "Pogo Hops", muscleGroup: "Plyos", trackingMode: "reps", muscleDistribution: [{group:"Plyos",percent:60},{group:"Calves",percent:25},{group:"Lower Legs",percent:15}] },
  { id: "pl7", name: "Bounds", muscleGroup: "Plyos", trackingMode: "distance", muscleDistribution: [{group:"Plyos",percent:55},{group:"Glutes",percent:25},{group:"Quads",percent:15},{group:"Hamstrings",percent:5}] },
  { id: "pl8", name: "Tuck Jumps", muscleGroup: "Plyos", trackingMode: "reps", muscleDistribution: [{group:"Plyos",percent:55},{group:"Quads",percent:25},{group:"Hip Flexors",percent:20}] }
];

for (const ex of exercisesData) {
  if (c_updates[ex.id]) {
    ex.muscleDistribution = c_updates[ex.id];
  }
  if (d_updates[ex.id]) {
    ex.muscleDistribution = d_updates[ex.id];
  }
}

const allData = [...exercisesData, ...newExercises];

// Verify lengths and sums
if (allData.length !== 178) {
  throw new Error('Expected 178 exercises, got ' + allData.length);
}

for (const ex of allData) {
  if (ex.muscleDistribution) {
    let sum = 0;
    for (const dist of ex.muscleDistribution) {
      sum += dist.percent;
    }
    if (sum !== 100) {
      throw new Error('Muscle distribution for ' + ex.id + ' does not sum to 100: ' + sum);
    }
  }
}

// Ensure output style:
// [
//   {
//     "id": "c1",
//     ...
//     "muscleDistribution": [
//       {
//         "group": "Chest",
//         ...
const formatted = "[\n" + allData.map(ex => {
  let lines = [];
  lines.push(`  {`);
  lines.push(`    "id": ${JSON.stringify(ex.id)},`);
  lines.push(`    "name": ${JSON.stringify(ex.name)},`);
  lines.push(`    "muscleGroup": ${JSON.stringify(ex.muscleGroup)},`);
  if (ex.trackingMode) lines.push(`    "trackingMode": ${JSON.stringify(ex.trackingMode)},`);
  
  if (ex.muscleDistribution) {
    let mdParts = ex.muscleDistribution.map((d: any) => `{"group":"${d.group}","percent":${d.percent}}`);
    lines.push(`    "muscleDistribution": [${mdParts.join(',')}]`);
  } else {
    // Remove comma from previous line if this is the last entry
    lines[lines.length - 1] = lines[lines.length - 1].replace(',', '');
  }
  lines.push(`  }`);
  return lines.join('\n');
}).join(',\n') + "\n]";

fs.writeFileSync('src/data/exercises.json', formatted);
console.log('exercises.json updated');
