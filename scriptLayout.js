const fs = require('fs');

const path = 'src/pages/ProfileSettings.tsx';
let data = fs.readFileSync(path, 'utf8');

// replace all "card-shell" with "accent-card" in the entire file
data = data.replace(/card-shell/g, 'accent-card');

// Now extract the Appearance card
const appearanceStart = data.indexOf('<Card className="accent-card no-print">\n            <CardHeader>\n              <CardTitle className="flex items-center gap-2">\n                <Settings className="text-gold" size={20} />\n                Appearance');
const appearanceEnd = data.indexOf('</CardContent>\n          </Card>', appearanceStart) + '</CardContent>\n          </Card>'.length;
let appearanceCard = data.substring(appearanceStart, appearanceEnd);

// Now remove App Settings entirely from its current location
const appSettingsStart = data.indexOf('{/* 3. App Settings */}');
const appSettingsEnd = data.indexOf('</div>', appearanceEnd) + '</div>'.length; // because it was wrapped in <div className="space-y-6">

data = data.substring(0, appSettingsStart) + data.substring(appSettingsEnd);

// Now insert the Appearance card right after the Account Details card ends
const accountDetailsEnd = data.indexOf('</CardContent>\n        </Card>', data.indexOf('Account Details')) + '</CardContent>\n        </Card>'.length;
data = data.substring(0, accountDetailsEnd) + '\n\n        {/* Appearance */}\n        ' + appearanceCard.replace('accent-card no-print', 'accent-card no-print h-full') + data.substring(accountDetailsEnd);

// Write it back
fs.writeFileSync(path, data, 'utf8');
console.log("Profile updated");
