const fs = require('fs');
const file = 'src/data/exercises.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const updates = {
  "Pendlay Row": [
    { "group": "Upper Back", "percent": 45 },
    { "group": "Lats", "percent": 25 },
    { "group": "Lower Back", "percent": 20 },
    { "group": "Biceps", "percent": 5 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Barbell Row": [
    { "group": "Lats", "percent": 45 },
    { "group": "Upper Back", "percent": 25 },
    { "group": "Lower Back", "percent": 15 },
    { "group": "Rear Delts", "percent": 5 },
    { "group": "Biceps", "percent": 5 },
    { "group": "Forearms", "percent": 5 }
  ],
  "DB Row": [
    { "group": "Upper Back", "percent": 40 },
    { "group": "Lats", "percent": 35 },
    { "group": "Rear Delts", "percent": 10 },
    { "group": "Biceps", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Chest Supported Row": [
    { "group": "Upper Back", "percent": 50 },
    { "group": "Lats", "percent": 25 },
    { "group": "Rear Delts", "percent": 10 },
    { "group": "Biceps", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Seated Cable Row": [
    { "group": "Upper Back", "percent": 45 },
    { "group": "Lats", "percent": 30 },
    { "group": "Rear Delts", "percent": 10 },
    { "group": "Biceps", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "T Bar Row": [
    { "group": "Upper Back", "percent": 45 },
    { "group": "Lats", "percent": 30 },
    { "group": "Rear Delts", "percent": 10 },
    { "group": "Biceps", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Machine High Row": [
    { "group": "Upper Back", "percent": 45 },
    { "group": "Lats", "percent": 30 },
    { "group": "Rear Delts", "percent": 10 },
    { "group": "Biceps", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Cable High Row": [
    { "group": "Upper Back", "percent": 45 },
    { "group": "Lats", "percent": 30 },
    { "group": "Rear Delts", "percent": 10 },
    { "group": "Biceps", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Iso Lateral Machine Rows": [
    { "group": "Upper Back", "percent": 45 },
    { "group": "Lats", "percent": 30 },
    { "group": "Rear Delts", "percent": 10 },
    { "group": "Biceps", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Iso Lateral Low Rows": [
    { "group": "Upper Back", "percent": 45 },
    { "group": "Lats", "percent": 30 },
    { "group": "Rear Delts", "percent": 10 },
    { "group": "Biceps", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Meadows Row": [
    { "group": "Upper Back", "percent": 45 },
    { "group": "Lats", "percent": 30 },
    { "group": "Rear Delts", "percent": 10 },
    { "group": "Biceps", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Landmine Row": [
    { "group": "Upper Back", "percent": 45 },
    { "group": "Lats", "percent": 30 },
    { "group": "Rear Delts", "percent": 10 },
    { "group": "Biceps", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Kroc Row": [
    { "group": "Lats", "percent": 45 },
    { "group": "Upper Back", "percent": 25 },
    { "group": "Forearms", "percent": 15 },
    { "group": "Biceps", "percent": 10 },
    { "group": "Rear Delts", "percent": 5 }
  ],
  "Inverted Row": [
    { "group": "Upper Back", "percent": 40 },
    { "group": "Lats", "percent": 30 },
    { "group": "Biceps", "percent": 15 },
    { "group": "Rear Delts", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Pull Ups": [
    { "group": "Lats", "percent": 60 },
    { "group": "Upper Back", "percent": 15 },
    { "group": "Biceps", "percent": 15 },
    { "group": "Forearms", "percent": 10 }
  ],
  "Chin Ups": [
    { "group": "Lats", "percent": 60 },
    { "group": "Biceps", "percent": 25 },
    { "group": "Upper Back", "percent": 5 },
    { "group": "Forearms", "percent": 10 }
  ],
  "Lat Pulldowns": [
    { "group": "Lats", "percent": 65 },
    { "group": "Biceps", "percent": 20 },
    { "group": "Upper Back", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Single Arm Lat Pulldown": [
    { "group": "Lats", "percent": 65 },
    { "group": "Biceps", "percent": 20 },
    { "group": "Upper Back", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Neutral Grip Pulldown": [
    { "group": "Lats", "percent": 65 },
    { "group": "Biceps", "percent": 20 },
    { "group": "Upper Back", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Straight Arm Pulldown": [
    { "group": "Lats", "percent": 80 },
    { "group": "Upper Back", "percent": 10 },
    { "group": "Triceps", "percent": 5 },
    { "group": "Core", "percent": 5 }
  ],
  "Machine Pullover": [
    { "group": "Lats", "percent": 80 },
    { "group": "Upper Back", "percent": 10 },
    { "group": "Triceps", "percent": 5 },
    { "group": "Core", "percent": 5 }
  ],
  "Cable Pullover": [
    { "group": "Lats", "percent": 80 },
    { "group": "Upper Back", "percent": 10 },
    { "group": "Triceps", "percent": 5 },
    { "group": "Core", "percent": 5 }
  ],
  "Front Squat": [
    { "group": "Quads", "percent": 50 },
    { "group": "Glutes", "percent": 20 },
    { "group": "Core", "percent": 15 },
    { "group": "Upper Back", "percent": 10 },
    { "group": "Hamstrings", "percent": 5 }
  ],
  "Back Squat": [
    { "group": "Quads", "percent": 45 },
    { "group": "Glutes", "percent": 25 },
    { "group": "Hamstrings", "percent": 15 },
    { "group": "Core", "percent": 10 },
    { "group": "Lower Back", "percent": 5 }
  ],
  "Zercher Bulgarian Split Squat": [
    { "group": "Quads", "percent": 35 },
    { "group": "Glutes", "percent": 20 },
    { "group": "Upper Back", "percent": 15 },
    { "group": "Core", "percent": 10 },
    { "group": "Biceps", "percent": 10 },
    { "group": "Hamstrings", "percent": 5 },
    { "group": "Hip Flexors", "percent": 5 }
  ],
  "Sumo Deadlift": [
    { "group": "Glutes", "percent": 30 },
    { "group": "Quads", "percent": 25 },
    { "group": "Hamstrings", "percent": 20 },
    { "group": "Lower Back", "percent": 15 },
    { "group": "Forearms", "percent": 10 }
  ],
  "DB Lunges": [
    { "group": "Quads", "percent": 40 },
    { "group": "Glutes", "percent": 25 },
    { "group": "Hip Flexors", "percent": 10 },
    { "group": "Hamstrings", "percent": 10 },
    { "group": "Core", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "KB Lunges": [
    { "group": "Quads", "percent": 40 },
    { "group": "Glutes", "percent": 25 },
    { "group": "Hip Flexors", "percent": 10 },
    { "group": "Hamstrings", "percent": 10 },
    { "group": "Core", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Step Ups": [
    { "group": "Quads", "percent": 40 },
    { "group": "Glutes", "percent": 30 },
    { "group": "Hip Flexors", "percent": 10 },
    { "group": "Hamstrings", "percent": 10 },
    { "group": "Core", "percent": 5 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Nordic Curl": [
    { "group": "Hamstrings", "percent": 80 },
    { "group": "Glutes", "percent": 10 },
    { "group": "Calves", "percent": 5 },
    { "group": "Core", "percent": 5 }
  ],
  "Single Leg RDL": [
    { "group": "Hamstrings", "percent": 45 },
    { "group": "Glutes", "percent": 30 },
    { "group": "Lower Back", "percent": 10 },
    { "group": "Core", "percent": 10 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Standing OHP": [
    { "group": "Shoulders", "percent": 45 },
    { "group": "Triceps", "percent": 30 },
    { "group": "Core", "percent": 15 },
    { "group": "Upper Back", "percent": 10 }
  ],
  "Arnold Press": [
    { "group": "Shoulders", "percent": 60 },
    { "group": "Triceps", "percent": 25 },
    { "group": "Chest", "percent": 10 },
    { "group": "Upper Back", "percent": 5 }
  ],
  "Push Press": [
    { "group": "Shoulders", "percent": 50 },
    { "group": "Triceps", "percent": 25 },
    { "group": "Quads", "percent": 10 },
    { "group": "Core", "percent": 10 },
    { "group": "Upper Back", "percent": 5 }
  ],
  "Z Press": [
    { "group": "Shoulders", "percent": 50 },
    { "group": "Triceps", "percent": 25 },
    { "group": "Core", "percent": 20 },
    { "group": "Upper Back", "percent": 5 }
  ],
  "Upright Row": [
    { "group": "Side Delts", "percent": 45 },
    { "group": "Traps", "percent": 35 },
    { "group": "Shoulders", "percent": 10 },
    { "group": "Biceps", "percent": 5 },
    { "group": "Forearms", "percent": 5 }
  ],
  "Face Pulls": [
    { "group": "Rear Delts", "percent": 45 },
    { "group": "Upper Back", "percent": 35 },
    { "group": "Traps", "percent": 10 },
    { "group": "Shoulders", "percent": 10 }
  ],
  "DB Trap Shrug": [
    { "group": "Traps", "percent": 80 },
    { "group": "Upper Back", "percent": 10 },
    { "group": "Forearms", "percent": 10 }
  ],
  "Barbell Shrug": [
    { "group": "Traps", "percent": 80 },
    { "group": "Upper Back", "percent": 10 },
    { "group": "Forearms", "percent": 10 }
  ],
  "Smith Shrug": [
    { "group": "Traps", "percent": 80 },
    { "group": "Upper Back", "percent": 10 },
    { "group": "Forearms", "percent": 10 }
  ],
  "Hanging Leg Raises": [
    { "group": "Hip Flexors", "percent": 50 },
    { "group": "Core", "percent": 35 },
    { "group": "Forearms", "percent": 10 },
    { "group": "Lats", "percent": 5 }
  ],
  "Russian Twists": [
    { "group": "Core", "percent": 65 },
    { "group": "Hip Flexors", "percent": 25 },
    { "group": "Forearms", "percent": 10 }
  ],
  "Pallof Press": [
    { "group": "Core", "percent": 85 },
    { "group": "Shoulders", "percent": 15 }
  ],
  "Medicine Ball Slams": [
    { "group": "Core", "percent": 60 },
    { "group": "Lats", "percent": 20 },
    { "group": "Shoulders", "percent": 20 }
  ],
  "Ab Wheel": [
    { "group": "Core", "percent": 85 },
    { "group": "Shoulders", "percent": 10 },
    { "group": "Lats", "percent": 5 }
  ],
  "Ab Rollouts": [
    { "group": "Core", "percent": 85 },
    { "group": "Shoulders", "percent": 10 },
    { "group": "Lats", "percent": 5 }
  ],
  "Plank": [
    { "group": "Core", "percent": 85 },
    { "group": "Shoulders", "percent": 10 },
    { "group": "Glutes", "percent": 5 }
  ],
  "Side Plank": [
    { "group": "Core", "percent": 90 },
    { "group": "Shoulders", "percent": 10 }
  ],
  "Cable Woodchop": [
    { "group": "Core", "percent": 80 },
    { "group": "Shoulders", "percent": 10 },
    { "group": "Lats", "percent": 10 }
  ],
  "Dragon Flag": [
    { "group": "Core", "percent": 65 },
    { "group": "Hip Flexors", "percent": 25 },
    { "group": "Lats", "percent": 5 },
    { "group": "Shoulders", "percent": 5 }
  ],
  "L Sit": [
    { "group": "Core", "percent": 50 },
    { "group": "Hip Flexors", "percent": 35 },
    { "group": "Lats", "percent": 10 },
    { "group": "Triceps", "percent": 5 }
  ],
  "Flutter Kicks": [
    { "group": "Hip Flexors", "percent": 65 },
    { "group": "Core", "percent": 35 }
  ],
  "Farmer's Carries": [
    { "group": "Forearms", "percent": 30 },
    { "group": "Traps", "percent": 25 },
    { "group": "Core", "percent": 25 },
    { "group": "Functional", "percent": 20 }
  ],
  "Suitcase Carry": [
    { "group": "Core", "percent": 40 },
    { "group": "Forearms", "percent": 25 },
    { "group": "Functional", "percent": 25 },
    { "group": "Traps", "percent": 10 }
  ],
  "Front Rack Carry": [
    { "group": "Core", "percent": 30 },
    { "group": "Upper Back", "percent": 25 },
    { "group": "Biceps", "percent": 15 },
    { "group": "Functional", "percent": 20 },
    { "group": "Quads", "percent": 10 }
  ],
  "Sled Pull": [
    { "group": "Functional", "percent": 35 },
    { "group": "Hamstrings", "percent": 20 },
    { "group": "Glutes", "percent": 20 },
    { "group": "Forearms", "percent": 15 },
    { "group": "Upper Back", "percent": 10 }
  ],
  "Yoke Carry": [
    { "group": "Traps", "percent": 30 },
    { "group": "Core", "percent": 25 },
    { "group": "Quads", "percent": 20 },
    { "group": "Functional", "percent": 15 },
    { "group": "Lower Back", "percent": 10 }
  ],
  "Zercher Carry": [
    { "group": "Core", "percent": 25 },
    { "group": "Upper Back", "percent": 25 },
    { "group": "Biceps", "percent": 20 },
    { "group": "Functional", "percent": 20 },
    { "group": "Quads", "percent": 10 }
  ],
  "Kettlebell Swing": [
    { "group": "Glutes", "percent": 35 },
    { "group": "Hamstrings", "percent": 25 },
    { "group": "Lower Back", "percent": 15 },
    { "group": "Core", "percent": 15 },
    { "group": "Functional", "percent": 10 }
  ],
  "Kettlebell Snatch": [
    { "group": "Functional", "percent": 25 },
    { "group": "Glutes", "percent": 20 },
    { "group": "Shoulders", "percent": 20 },
    { "group": "Hamstrings", "percent": 15 },
    { "group": "Core", "percent": 10 },
    { "group": "Forearms", "percent": 10 }
  ],
  "Kettlebell Clean": [
    { "group": "Functional", "percent": 25 },
    { "group": "Glutes", "percent": 20 },
    { "group": "Upper Back", "percent": 15 },
    { "group": "Hamstrings", "percent": 15 },
    { "group": "Core", "percent": 15 },
    { "group": "Forearms", "percent": 10 }
  ],
  "Bear Crawl": [
    { "group": "Functional", "percent": 35 },
    { "group": "Core", "percent": 30 },
    { "group": "Shoulders", "percent": 20 },
    { "group": "Hip Flexors", "percent": 15 }
  ],
  "Burpees": [
    { "group": "Functional", "percent": 40 },
    { "group": "Chest", "percent": 20 },
    { "group": "Triceps", "percent": 15 },
    { "group": "Shoulders", "percent": 15 },
    { "group": "Quads", "percent": 10 }
  ],
  "Battle Ropes": [
    { "group": "Functional", "percent": 50 },
    { "group": "Shoulders", "percent": 20 },
    { "group": "Forearms", "percent": 15 },
    { "group": "Core", "percent": 15 }
  ],
  "Split Squat Plyos": [
    { "group": "Plyos", "percent": 45 },
    { "group": "Quads", "percent": 25 },
    { "group": "Glutes", "percent": 20 },
    { "group": "Hip Flexors", "percent": 10 }
  ],
  "Explosive Split Jump Switches": [
    { "group": "Plyos", "percent": 45 },
    { "group": "Quads", "percent": 25 },
    { "group": "Glutes", "percent": 20 },
    { "group": "Hip Flexors", "percent": 10 }
  ],
  "Bounds": [
    { "group": "Plyos", "percent": 50 },
    { "group": "Glutes", "percent": 25 },
    { "group": "Quads", "percent": 15 },
    { "group": "Hamstrings", "percent": 5 },
    { "group": "Hip Flexors", "percent": 5 }
  ],
  "Tuck Jumps": [
    { "group": "Plyos", "percent": 50 },
    { "group": "Quads", "percent": 25 },
    { "group": "Hip Flexors", "percent": 15 },
    { "group": "Core", "percent": 10 }
  ]
};

let matchCount = 0;
const matchedNames = new Set();
let conditioningReplaced = 0;

for (let ex of data) {
  if (updates[ex.name]) {
    ex.muscleDistribution = updates[ex.name];
    matchCount++;
    matchedNames.add(ex.name);
  }
  
  if (ex.muscleDistribution) {
    let changedToFunctional = false;
    for (let d of ex.muscleDistribution) {
      if (d.group === "Conditioning") {
        d.group = "Functional";
        changedToFunctional = true;
      }
    }
    if (changedToFunctional) {
      conditioningReplaced++;
      let sum = ex.muscleDistribution.reduce((acc, obj) => acc + obj.percent, 0);
      if (sum !== 100) {
        console.error("Mismatch sum after removing conditioning: " + ex.name + " = " + sum);
      }
    }
  }

  if (ex.muscleDistribution) {
    let sum = ex.muscleDistribution.reduce((acc, obj) => acc + obj.percent, 0);
    if (sum !== 100) {
      console.error("Mismatch sum for: " + ex.name + " = " + sum);
    }
  }
}

const requestedNames = Object.keys(updates);
const notFound = requestedNames.filter(n => !matchedNames.has(n));

console.log(JSON.stringify({ matchCount, conditioningReplaced, notFound }));

fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
