import { execSync } from 'child_process';
try {
  execSync('git config --global --add safe.directory /app/applet');
  console.log(execSync('git log -p firebase-applet-config.json').toString());
} catch(e) {
  console.log(e);
}
