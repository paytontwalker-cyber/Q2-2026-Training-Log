const fs = require('fs');

const path = 'src/data/templates.json';
const data = JSON.parse(fs.readFileSync(path, 'utf-8'));

const split = data.splitTemplates.find(s => s.id === 'hybrid-performance-spring-2026');

split.description = "Hybrid functional training split built to balance strength, volume, athletic movement, and running. Main compounds stay heavy and low-rep, accessories build targeted volume, and conditioning can be layered around the weekly structure.";

// Monday
split.days["Monday"] = {
  name: "Leg Day (Posterior/Hammy)",
  running: split.days["Monday"].running || "None",
  exercises: [
    { name: "Deadlift", sets: "1", reps: "3" },
    { name: "RDL", sets: "3", reps: "3", superset: [{ name: "Pull Ups", sets: "3", reps: "AMRAP" }] },
    { name: "Single Leg DB RDL", sets: "3", reps: "5" },
    { name: "Nordic Hamstrings/Curls", sets: "3", reps: "8" },
    { name: "Calf Raises", sets: "3", reps: "8" }
  ],
  summary: "Leg Day (Posterior/Hammy)\n- Deadlift: 1x3\n- Barbell RDL: 3x3\n  - Pull-Up: 3xAMRAP\n- Single Leg DB RDL: 3x5\n- Nordic Hamstrings/Curls: 3x8\n- Calf Raises 3x8"
};

// Tuesday
split.days["Tuesday"] = {
  name: "Push Day",
  running: split.days["Tuesday"].running || "None",
  exercises: [
    { name: "Hanging Leg Raises", sets: "3", reps: "10" },
    { name: "Flat Bench Press", sets: "1", reps: "3" },
    { name: "Seated Barbell Press", sets: "3", reps: "3" },
    { name: "DB Lateral Raises", sets: "3", reps: "20" },
    { name: "Machine Lateral Raises", sets: "2", reps: "10" },
    { name: "Chest Fly", sets: "2", reps: "8" },
    { name: "Incline Machine Press", sets: "2", reps: "6" },
    { name: "JM Press", sets: "3", reps: "8" }
  ],
  summary: "Push Day\n- Hanging Leg Raises 3x10\n- Flat Bench Press: 1x3\n- Seated Barbell Press: 3x3\n- DB Lateral Raises: 3x20\n- Machine Lateral Raises: 2x10\n- Chest Fly: 2x8\n- Incline Machine Press: 2x6\n- JM Press: 3x8"
};

// Wednesday
split.days["Wednesday"] = {
  name: "Leg Day (Anterior/Quad)",
  running: split.days["Wednesday"].running || "None",
  exercises: [
    { name: "Front Squat", sets: "3", reps: "3" },
    { name: "Zercher Bulgarian Split Squat", sets: "3", reps: "5" },
    { name: "Russian Twists", sets: "3", reps: "30", superset: [{ name: "KB Lunges", sets: "3", reps: "8" }] },
    { name: "Sled Push", sets: "3", reps: "50m" },
    { name: "Split Squat Plyos", sets: "3", reps: "6" },
    { name: "KB Seated Tibial Raises", sets: "3", reps: "10" },
    { name: "Ankle Rotations", sets: "3", reps: "10" }
  ],
  summary: "Leg Day (Anterior/Quad)\n- Front Squat: 3x3\n- Zercher Bulgarian Split Squat: 3x5\n- Russian Twists: 3x30\n  - KB Lunges: 3x8\n- Sled Push: 3x50m\n- Split Squat Plyos: 3x6\n- KB Seated Tibial Raises: 3x10\n- Ankle Rotations: 3x10"
};

// Thursday
split.days["Thursday"] = {
  name: "Pull Day",
  running: split.days["Thursday"].running || "None",
  exercises: [
    { name: "Face Pulls", sets: "3", reps: "12", superset: [{ name: "Rear Delt Flyes", sets: "3", reps: "15" }] },
    { name: "Pendlay Row", sets: "3", reps: "3" },
    { name: "Lat Pulldowns", sets: "3", reps: "6" },
    { name: "ISO Lateral Low Rows", sets: "3", reps: "8" },
    { name: "Iso-Lateral Machine Rows", sets: "3", reps: "8" },
    { name: "Hammer Curls", sets: "3", reps: "10" },
    { name: "Seated Incline DB Curls", sets: "3", reps: "8" },
    { name: "DB Trap Shrug", sets: "3", reps: "8", superset: [{ name: "Farmer's Carries", sets: "3", reps: "50m" }] }
  ],
  summary: "Pull Day\n- Face Pulls: 3x12\n  - Rear Delt Flyes: 3x15\n- Pendlay Row: 3x3\n- Lat Pulldowns: 3x6\n- ISO Lateral Low Rows: 3x8\n- Iso-Lateral Machine Rows: 3x8\n- Hammer Curls: 3x10\n- Seated Incline DB Curls: 3x8\n- DB Trap Shrug: 3x8\n  - Farmer's Carries: 3x50m"
};

fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
console.log('done');
