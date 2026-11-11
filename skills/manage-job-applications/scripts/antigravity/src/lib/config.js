/**
 * NEW REUSABLE ADAPTER: src/lib/config.js
 * Central configuration loader for environment variables, installer profile,
 * localization/scoring rules, verified answers, and discovery targets.
 * Supports running completely locally (STORAGE_BACKEND=local) or connected
 * to the installer's own Google Drive/Sheets (STORAGE_BACKEND=google).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function loadDotEnv(envFile = path.join(REPO_ROOT, '.env')) {
  if (!fs.existsSync(envFile)) return;
  const raw = fs.readFileSync(envFile, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~/') || p.startsWith('~\\')) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

function resolvePathMaybe(p, fallback) {
  const target = p || fallback;
  const expanded = expandHome(target);
  return path.isAbsolute(expanded) ? expanded : path.resolve(REPO_ROOT, expanded);
}

function loadJsonWithFallback(primaryPath, examplePath) {
  if (primaryPath && fs.existsSync(primaryPath)) {
    return { path: primaryPath, isExample: false, data: JSON.parse(fs.readFileSync(primaryPath, 'utf8')) };
  }
  if (examplePath && fs.existsSync(examplePath)) {
    return { path: examplePath, isExample: true, data: JSON.parse(fs.readFileSync(examplePath, 'utf8')) };
  }
  throw new Error(`Missing config JSON file at ${primaryPath} or ${examplePath}`);
}

function loadConfig(options = {}) {
  if (options.loadEnv !== false) loadDotEnv(options.envPath);

  const storageBackend = (process.env.STORAGE_BACKEND || 'local').toLowerCase();
  const localDataDir = resolvePathMaybe(process.env.LOCAL_DATA_DIR, './data');
  const cvOutputDir = resolvePathMaybe(process.env.CV_OUTPUT_DIR, path.join(localDataDir, 'cvs'));
  const artifactsDir = resolvePathMaybe(process.env.ARTIFACTS_DIR, path.join(localDataDir, 'artifacts'));
  const cacheDir = resolvePathMaybe(process.env.CACHE_DIR, path.join(localDataDir, 'cache'));

  const profilePath = resolvePathMaybe(process.env.JOBKIT_PROFILE_PATH, './config/profile.json');
  const rulesPath = resolvePathMaybe(process.env.JOBKIT_RULES_PATH, './config/rules.json');
  const answersPath = resolvePathMaybe(process.env.JOBKIT_ANSWERS_PATH, './config/answers.json');
  const targetsPath = resolvePathMaybe(process.env.JOBKIT_TARGETS_PATH, './config/targets.json');

  const profileRes = loadJsonWithFallback(profilePath, path.join(REPO_ROOT, 'config', 'profile.example.json'));
  const rulesRes = loadJsonWithFallback(rulesPath, path.join(REPO_ROOT, 'config', 'rules.example.json'));
  const answersRes = loadJsonWithFallback(answersPath, path.join(REPO_ROOT, 'config', 'answers.example.json'));
  const targetsRes = loadJsonWithFallback(targetsPath, path.join(REPO_ROOT, 'config', 'targets.example.json'));

  const config = {
    repoRoot: REPO_ROOT,
    storageBackend,
    browser: {
      cdpUrl: process.env.CHROME_CDP_URL || 'http://127.0.0.1:9222',
      channel: process.env.BROWSER_CHANNEL || 'chrome',
      headless: String(process.env.BROWSER_HEADLESS || 'false').toLowerCase() === 'true',
      executablePath: process.env.BROWSER_EXECUTABLE_PATH || undefined
    },
    paths: {
      localDataDir,
      cvOutputDir,
      artifactsDir,
      cacheDir,
      sponsorXlsxPath: resolvePathMaybe(process.env.DRIVE_SPONSOR_XLSX_PATH, path.join(localDataDir, 'sponsor_directory.xlsx')),
      googleTokenPath: resolvePathMaybe(process.env.GOOGLE_TOKEN_PATH, path.join(os.homedir(), '.config', 'job-automation-kit', 'google_token.json'))
    },
    google: {
      enabled: storageBackend === 'google',
      rootFolderId: process.env.DRIVE_ROOT_FOLDER_ID || '',
      cvArchiveFolderId: process.env.DRIVE_CV_ARCHIVE_FOLDER_ID || '',
      sheets: {
        primary: process.env.SLOVAKIA_SHEET_ID || '',
        secondary: process.env.SCHENGEN_SHEET_ID || '',
        productionTracker: process.env.PRODUCTION_TRACKER_SHEET_ID || '',
        assistantSync: process.env.GEMINI_TRACKER_SHEET_ID || ''
      }
    },
    meta: {
      profileIsExample: profileRes.isExample,
      rulesIsExample: rulesRes.isExample,
      answersIsExample: answersRes.isExample,
      targetsIsExample: targetsRes.isExample
    },
    profile: profileRes.data,
    rules: rulesRes.data,
    answers: answersRes.data,
    targets: targetsRes.data
  };

  return config;
}

function assertRealProfile(cfg) {
  const candidate = cfg?.profile?.candidate || {};
  const required = ['fullName', 'firstName', 'lastName', 'email', 'phone', 'homeCity', 'homeCountry'];
  if (cfg?.meta?.profileIsExample) throw new Error('Refusing live submission with example profile data.');
  for (const field of required) {
    if (typeof candidate[field] !== 'string' || !candidate[field].trim()) {
      throw new Error(`Required candidate field is missing: ${field}`);
    }
  }
  const hasPlaceholder = value => typeof value === 'string' ? /\{\{|\}\}|YYYY-MM/.test(value) :
    value && typeof value === 'object' && Object.values(value).some(hasPlaceholder);
  if (hasPlaceholder(cfg.profile)) {
    throw new Error('Unresolved profile placeholders; confirm facts before filling forms.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) throw new Error('Invalid candidate email.');
  if (!/^\+[1-9]\d{6,14}$/.test(candidate.phone)) throw new Error('Candidate phone must use E.164 format.');

}

function ensureDirs(cfg) {
  for (const dir of [cfg.paths.localDataDir, cfg.paths.cvOutputDir, cfg.paths.artifactsDir, cfg.paths.cacheDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

if (require.main === module && process.argv.includes('--doctor')) {
  const cfg = loadConfig();
  console.log(JSON.stringify({
    storageBackend: cfg.storageBackend,
    googleConfigured: Boolean(cfg.google.sheets.primary || cfg.google.sheets.secondary),
    profileSource: cfg.meta.profileIsExample ? 'example-placeholder' : 'custom',
    rulesSource: cfg.meta.rulesIsExample ? 'example-default' : 'custom',
    answersCount: Array.isArray(cfg.answers) ? cfg.answers.length : 0,
    paths: {
      localDataDir: cfg.paths.localDataDir,
      cvOutputDir: cfg.paths.cvOutputDir,
      artifactsDir: cfg.paths.artifactsDir,
      cacheDir: cfg.paths.cacheDir
    }
  }, null, 2));
}

module.exports = {
  REPO_ROOT,
  loadDotEnv,
  loadConfig,
  assertRealProfile,
  ensureDirs,
  expandHome,
  resolvePathMaybe
};
