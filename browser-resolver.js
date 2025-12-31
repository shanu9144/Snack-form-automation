const os = require('os');
const fs = require('fs');
const path = require('path');

function exists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function getBrowserPaths() {
  const envPath = process.env.BROWSER_PATH;
  if (envPath && exists(envPath)) return [envPath];

  const paths = [];
  const platform = os.platform();

  // Linux
  if (platform === 'linux') {
    paths.push('/snap/bin/brave');
    paths.push('/snap/bin/chromium');
    paths.push('/usr/bin/brave-browser');
    paths.push('/usr/bin/brave');
    paths.push('/usr/bin/google-chrome');
    paths.push('/usr/bin/chromium-browser');
    paths.push('/usr/bin/chromium');
  }
  // macOS
  else if (platform === 'darwin') {
    paths.push('/Applications/Brave Browser.app/Contents/MacOS/Brave Browser');
    paths.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    paths.push('/Applications/Chromium.app/Contents/MacOS/Chromium');
  }
  // Windows
  else if (platform === 'win32') {
    const programFiles = process.env['PROGRAMFILES'] || 'C:\\Program Files';
    const programFilesx86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    paths.push(path.join(programFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'));
    paths.push(path.join(programFilesx86, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'));
    paths.push(path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    paths.push(path.join(programFilesx86, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    paths.push(path.join(programFiles, 'Chromium', 'Application', 'chromium.exe'));
    paths.push(path.join(programFilesx86, 'Chromium', 'Application', 'chromium.exe'));
  }

  return paths.filter(exists);
}

function getProfileDirs(browserType) {
  const envProfile = process.env.USER_DATA_DIR;
  if (envProfile && exists(envProfile)) return [envProfile];

  const platform = os.platform();
  const home = os.homedir();
  const dirs = [];

  // Linux
  if (platform === 'linux') {
    if (browserType === 'brave') {
      const base = path.join(home, '.config', 'BraveSoftware', 'Brave-Browser');
      dirs.push(path.join(base, 'Default'));
      dirs.push(path.join(base, 'Profile 1'));
      dirs.push(path.join(base, 'Profile 2'));
      dirs.push(base);
    } else if (browserType === 'chrome') {
      const base = path.join(home, '.config', 'google-chrome');
      dirs.push(path.join(base, 'Default'));
      dirs.push(path.join(base, 'Profile 1'));
      dirs.push(path.join(base, 'Profile 2'));
      dirs.push(base);
    } else if (browserType === 'chromium') {
      const base = path.join(home, '.config', 'chromium');
      dirs.push(path.join(base, 'Default'));
      dirs.push(path.join(base, 'Profile 1'));
      dirs.push(path.join(base, 'Profile 2'));
      dirs.push(base);
    }
  }
  // macOS
  else if (platform === 'darwin') {
    if (browserType === 'brave') {
      const base = path.join(home, 'Library', 'Application Support', 'BraveSoftware', 'Brave-Browser');
      dirs.push(path.join(base, 'Default'));
      dirs.push(path.join(base, 'Profile 1'));
      dirs.push(path.join(base, 'Profile 2'));
      dirs.push(base);
    } else if (browserType === 'chrome') {
      const base = path.join(home, 'Library', 'Application Support', 'Google', 'Chrome');
      dirs.push(path.join(base, 'Default'));
      dirs.push(path.join(base, 'Profile 1'));
      dirs.push(path.join(base, 'Profile 2'));
      dirs.push(base);
    } else if (browserType === 'chromium') {
      const base = path.join(home, 'Library', 'Application Support', 'Chromium');
      dirs.push(path.join(base, 'Default'));
      dirs.push(path.join(base, 'Profile 1'));
      dirs.push(path.join(base, 'Profile 2'));
      dirs.push(base);
    }
  }
  // Windows
  else if (platform === 'win32') {
    if (browserType === 'brave') {
      const base = path.join(home, 'AppData', 'Local', 'BraveSoftware', 'Brave-Browser', 'User Data');
      dirs.push(path.join(base, 'Default'));
      dirs.push(path.join(base, 'Profile 1'));
      dirs.push(path.join(base, 'Profile 2'));
      dirs.push(base);
    } else if (browserType === 'chrome') {
      const base = path.join(home, 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
      dirs.push(path.join(base, 'Default'));
      dirs.push(path.join(base, 'Profile 1'));
      dirs.push(path.join(base, 'Profile 2'));
      dirs.push(base);
    } else if (browserType === 'chromium') {
      const base = path.join(home, 'AppData', 'Local', 'Chromium', 'User Data');
      dirs.push(path.join(base, 'Default'));
      dirs.push(path.join(base, 'Profile 1'));
      dirs.push(path.join(base, 'Profile 2'));
      dirs.push(base);
    }
  }

  return dirs.filter(exists);
}

function resolveBrowserAndProfile({ log = false } = {}) {
  const browserPaths = getBrowserPaths();
  let browserType = null;
  let browserPath = null;

  for (const p of browserPaths) {
    if (p.toLowerCase().includes('brave')) { browserType = 'brave'; browserPath = p; break; }
    if (p.toLowerCase().includes('chrome')) { browserType = 'chrome'; browserPath = p; break; }
    if (p.toLowerCase().includes('chromium')) { browserType = 'chromium'; browserPath = p; break; }
  }

  if (!browserPath) {
    if (log) console.log('No supported browser found.');
    return { browserPath: null, userDataDir: null, browserType: null };
  }

  const profileDirs = getProfileDirs(browserType);
  let userDataDir = profileDirs.length ? profileDirs[0] : null;

  if (log) {
    console.log(`Selected browser: ${browserType} (${browserPath})`);
    console.log(`Selected profile: ${userDataDir}`);
  }

  return { browserPath, userDataDir, browserType };
}

module.exports = { resolveBrowserAndProfile };
