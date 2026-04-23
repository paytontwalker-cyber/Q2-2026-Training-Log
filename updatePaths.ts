import fs from 'fs';

let content = fs.readFileSync('src/lib/bodyMapPaths.ts', 'utf8');

// The exact string to replace (Adductors block)
const adductorsBlock = `
  // Adductors
  {
    slug: "adductors",
    color: "#3f3f3f",
    path: {
      left: [
        "M1070.06 785.19c2.95 1.36 1.8 10.43 1.49 13.04q-3.98 33.27-14.66 64.61a.39.39 0 01-.76-.17c.9-7.05 2.31-14.29 2.16-20.92q-.68-30.14-18.71-54.52-.29-.39.18-.49c7.42-1.52 23.53-4.69 30.3-1.55z",
      ],
      right: [
        "M1127.24 787.66c-15.99 21.49-22.3 48.51-16.08 74.83a.47.46-63.2 01-.88.29q-1.99-4.69-3.65-10.24-8.29-27.75-11.6-56.54c-.65-5.71-1.1-11.77 6.87-11.9q13-.19 25.68 2.83a.31.24 41.2 01.1.53q-.12.01-.27.07-.1.04-.17.13z",
      ],
    },
  },`;

if (!content.includes(adductorsBlock)) {
    console.error("Adductors block not found exactly as expected!");
}

content = content.replace(adductorsBlock, '');

const hamstringLeftTarget = `"M1052.52 855.62a.04.04 0 01.08.01q1.07 9.9 2.17 19.87.33 3.04-2.37 14.18c-3.83 15.8-8.15 31.11-8.9 47.47-.99 21.61-3.11 45.66-9.92 66.3q-1.49 4.52-.87-.2 3.38-25.36 3.7-51.99c.05-3.74-.4-10.32.2-15.58 2.19-19.2 7.39-38.25 11.75-57.05 1.78-7.64 2.93-15.21 4.16-23.01z",`;
const hamstringLeftNew = hamstringLeftTarget + `\n        "M1070.06 785.19c2.95 1.36 1.8 10.43 1.49 13.04q-3.98 33.27-14.66 64.61a.39.39 0 01-.76-.17c.9-7.05 2.31-14.29 2.16-20.92q-.68-30.14-18.71-54.52-.29-.39.18-.49c7.42-1.52 23.53-4.69 30.3-1.55z",`;

if (!content.includes(hamstringLeftTarget)) {
    console.error("Hamstring left target not found exactly as expected!");
}

content = content.replace(hamstringLeftTarget, hamstringLeftNew);

const hamstringRightTarget = `"M1202.61 741.08a.44.44 0 01.72.03c.52.82.9 1.86.95 2.91q.73 15.98.37 31.97-1.16 52.95-7.85 105.49-1.88 14.74-5.97 29.04-1 3.52-1.92 4.95-1.57 2.47-1.39-.37c.58-9.44 1.83-19.17 1.71-28.16-.32-24.52-4.94-49.11-3.95-72.75.69-16.54 2.5-33.51 7.54-49.38q2.99-9.4 6.61-18.6.74-1.88 3.18-5.13z",`;
const hamstringRightNew = hamstringRightTarget + `\n        "M1127.24 787.66c-15.99 21.49-22.3 48.51-16.08 74.83a.47.46-63.2 01-.88.29q-1.99-4.69-3.65-10.24-8.29-27.75-11.6-56.54c-.65-5.71-1.1-11.77 6.87-11.9q13-.19 25.68 2.83a.31.24 41.2 01.1.53q-.12.01-.27.07-.1.04-.17.13z",`;

if (!content.includes(hamstringRightTarget)) {
    console.error("Hamstring right target not found exactly as expected!");
}

content = content.replace(hamstringRightTarget, hamstringRightNew);

fs.writeFileSync('src/lib/bodyMapPaths.ts', content);
console.log('bodyMapPaths.ts updated');
