/**
 * Offline Unit & Smoke Test Suite (`npm test`)
 * Verifies config fallback loading, secrets placeholder filtering, LocalStorageAdapter
 * (tracker CRUD, CSV & Markdown generation, deduplication), city header localization,
 * and dynamic HTML CV template assembly without network calls or live ATS access.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { loadConfig, assertRealProfile } = require('../src/lib/config');
const { isPlaceholder, getPortalCredentials } = require('../src/lib/secrets');
const { createStorageAdapter } = require('../src/lib/storage');
const { resolveCityHeader, buildCompliantHtml } = require('../src/originals_sanitized/cv_generator_compliant');

test('loadConfig loads example configs cleanly in local fallback mode', () => {
  const cfg = loadConfig({ loadEnv: false });
  assert.equal(cfg.storageBackend, 'local');
  assert.equal(cfg.meta.profileIsExample, true);
  assert.throws(() => assertRealProfile(cfg), /Refusing live submission/);
});

test('secrets filters out template placeholders', () => {
  assert.equal(isPlaceholder('{{APPLICANT_EMAIL}}'), true);
  assert.equal(isPlaceholder(''), true);
  assert.equal(isPlaceholder('configured-value'), false);

  const prevEmail = process.env.PORTAL_LOGIN_EMAIL;
  const prevPass = process.env.PORTAL_PRIMARY_PASSWORD;
  process.env.PORTAL_LOGIN_EMAIL = '{{APPLICANT_EMAIL}}';
  process.env.PORTAL_PRIMARY_PASSWORD = '{{PORTAL_PRIMARY_PASSWORD}}';
  const creds = getPortalCredentials(loadConfig({ loadEnv: false }));
  assert.equal(creds.configured, false);
  process.env.PORTAL_LOGIN_EMAIL = prevEmail;
  process.env.PORTAL_PRIMARY_PASSWORD = prevPass;
});

test('LocalStorageAdapter performs tracker CRUD, dedup, CSV and Markdown rendering', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jobkit-test-'));
  try {
    const cfg = loadConfig({ loadEnv: false });
    cfg.storageBackend = 'local';
    cfg.paths.localDataDir = tmpRoot;
    cfg.paths.cvOutputDir = path.join(tmpRoot, 'cvs');

    const storage = createStorageAdapter(cfg);
    assert.equal(storage.mode, 'local');

    const job = {
      id: 'TEST-101',
      region: 'secondary',
      company: 'Example Test Corp',
      title: 'Financial Analyst',
      location: 'Berlin, Germany',
      score: 94,
      status: 'Ready to Apply',
      link: 'https://careers.example.com/jobs/TEST-101'
    };
    storage.upsertJob(job);
    assert.equal(storage.hasDuplicateJob(job), true);
    assert.equal(storage.hasDuplicateJob({ id: 'OTHER', company: 'Example Test Corp', title: 'Financial Analyst' }), true);

    const updated = await storage.updateStatus('secondary', 'TEST-101', 'Applied & Confirmed (2026-11-11)');
    assert.equal(updated, 1);

    storage.appendActivity({
      area: 'Job applications',
      task: 'Submit TEST-101',
      status: 'Done',
      result: 'Confirmed on test portal',
      nextStep: 'Monitor inbox'
    });

    const counts = storage.getSummaryCounts();
    assert.equal(counts.total, 1);
    assert.equal(counts.applied, 1);
    assert.equal(fs.existsSync(path.join(tmpRoot, 'jobs_tracker.csv')), true);
    assert.equal(fs.existsSync(path.join(tmpRoot, 'Production_Tracker.md')), true);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('resolveCityHeader & buildCompliantHtml map target cities and toggle technical projects', () => {
  const cfg = loadConfig({ loadEnv: false });
  assert.equal(resolveCityHeader('Berlin, Germany (Hybrid)', cfg.rules), 'Berlin, Germany');
  assert.equal(resolveCityHeader('München / Remote', cfg.rules), 'Munich, Germany');
  assert.equal(resolveCityHeader('Amsterdam, Netherlands', cfg.rules), 'Amsterdam, Netherlands');

  const htmlAccounting = buildCompliantHtml({
    headline: 'GL Specialist',
    summary: 'Accounting summary',
    cityHeader: 'Berlin, Germany',
    includeEtlProject: false,
    profile: cfg.profile
  });
  assert.match(htmlAccounting, /Berlin, Germany/);
  assert.doesNotMatch(htmlAccounting, /{{VERIFIED_PROJECT_NAME}}/);

  const htmlTech = buildCompliantHtml({
    headline: 'BI Analyst',
    summary: 'Data summary',
    cityHeader: 'Munich, Germany',
    includeEtlProject: true,
    profile: cfg.profile
  });
  assert.match(htmlTech, /Munich, Germany/);
  assert.match(htmlTech, /{{VERIFIED_PROJECT_NAME}}/);
});

test('status update requires an exact nonempty ID and preserves nearby jobs', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jobkit-exact-'));
  try {
    const cfg = loadConfig({ loadEnv: false });
    cfg.paths.localDataDir = tmpRoot;
    cfg.paths.cvOutputDir = path.join(tmpRoot, 'cvs');
    const store = createStorageAdapter(cfg);
    store.upsertJob({ id: '101', region: 'primary', company: 'Example', title: 'A', status: 'Ready' });
    store.upsertJob({ id: '1010', region: 'primary', company: 'Example', title: 'B', status: 'Ready' });
    assert.equal(await store.updateStatus('primary', '', 'Closed'), 0);
    assert.equal(await store.updateStatus('primary', '101', 'Closed'), 1);
    assert.equal(store.listJobs().find(j => j.id === '1010').status, 'Ready');
  } finally { fs.rmSync(tmpRoot, { recursive: true, force: true }); }
});

test('CV distinguishes residence from a target city', () => {
  const cfg = loadConfig({ loadEnv: false });
  cfg.profile.candidate.homeCity = 'Example Residence';
  cfg.profile.candidate.homeCountry = 'Example Country';
  const html = buildCompliantHtml({ cityHeader: 'Berlin, Germany', profile: cfg.profile });
  assert.match(html, /Location:<\/strong> Example Residence, Example Country/);
  assert.match(html, /Target \/ relocation preference: Berlin, Germany/);
});
