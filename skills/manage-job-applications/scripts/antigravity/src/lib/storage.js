/**
 * NEW REUSABLE ADAPTER: src/lib/storage.js
 * Dual-backend persistence layer:
 *   - "google": Installer's own Google Sheets & Google Drive folders via OAuth
 *   - "local": Zero-cloud fallback storing structured JSON, CSV, Markdown tracker,
 *     and tailored CV PDFs in a configurable local directory (LOCAL_DATA_DIR).
 *
 * Includes deduplication keys, atomic JSON writes, and automatic fallback when
 * Google credentials or Sheet IDs are absent or declined.
 */
const fs = require('fs');
const path = require('path');

function normalizeKey(str) {
  return String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function escapeCsvCell(val) {
  const s = String(val ?? '');
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

class LocalStorageAdapter {
  constructor(cfg) {
    this.cfg = cfg;
    this.baseDir = cfg.paths.localDataDir;
    this.cvDir = cfg.paths.cvOutputDir;
    this.jobsFile = path.join(this.baseDir, 'jobs_tracker.json');
    this.csvFile = path.join(this.baseDir, 'jobs_tracker.csv');
    this.activityFile = path.join(this.baseDir, 'activity_log.json');
    this.markdownTrackerFile = path.join(this.baseDir, 'Production_Tracker.md');
    this.answersFile = path.join(this.baseDir, 'confirmed_answers.json');
  }

  init() {
    fs.mkdirSync(this.baseDir, { recursive: true });
    fs.mkdirSync(this.cvDir, { recursive: true });
    if (!fs.existsSync(this.jobsFile)) this._writeJson(this.jobsFile, { jobs: [] });
    if (!fs.existsSync(this.activityFile)) this._writeJson(this.activityFile, { activities: [] });
    if (!fs.existsSync(this.answersFile)) {
      this._writeJson(this.answersFile, { answers: this.cfg.answers || [] });
    }
    this._renderDerivedFiles();
  }

  _readJson(filePath, fallback) {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  _writeJson(filePath, data) {
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, filePath);
  }

  listJobs(region = null) {
    const data = this._readJson(this.jobsFile, { jobs: [] });
    const jobs = data.jobs || [];
    if (!region) return jobs;
    return jobs.filter((j) => normalizeKey(j.region) === normalizeKey(region));
  }

  hasDuplicateJob(candidateJob) {
    const jobs = this.listJobs();
    const cid = normalizeKey(candidateJob.id);
    const curl = normalizeKey(candidateJob.link);
    const cKey = `${normalizeKey(candidateJob.company)}|${normalizeKey(candidateJob.title)}`;
    return jobs.some((existing) => {
      if (cid && normalizeKey(existing.id) === cid) return true;
      if (curl && normalizeKey(existing.link) === curl) return true;
      return `${normalizeKey(existing.company)}|${normalizeKey(existing.title)}` === cKey;
    });
  }

  upsertJob(job) {
    const data = this._readJson(this.jobsFile, { jobs: [] });
    const jobs = data.jobs || [];
    const idx = jobs.findIndex((j) => normalizeKey(j.id) === normalizeKey(job.id) && normalizeKey(j.region || '') === normalizeKey(job.region || ''));
    const stamped = {
      ...job,
      updatedAt: job.updatedAt || new Date().toISOString().slice(0, 10)
    };
    if (idx >= 0) {
      jobs[idx] = { ...jobs[idx], ...stamped };
    } else {
      jobs.push(stamped);
    }
    this._writeJson(this.jobsFile, { jobs });
    this._renderDerivedFiles();
    return stamped;
  }

  updateStatus(region, jobId, statusText, proof = null) {
    const data = this._readJson(this.jobsFile, { jobs: [] });
    let updated = 0;
    const targetId = normalizeKey(jobId);
    for (const j of data.jobs || []) {
      const regionMatch = !region || normalizeKey(region) === 'all' || normalizeKey(j.region) === normalizeKey(region);
      if (regionMatch && targetId && normalizeKey(j.id) === targetId) {
        j.status = statusText;
        j.updatedAt = new Date().toISOString().slice(0, 10);
        if (proof) j.confirmationProof = proof;
        updated++;
      }
    }
    this._writeJson(this.jobsFile, data);
    this._renderDerivedFiles();
    return updated;
  }

  appendActivity(entry) {
    const data = this._readJson(this.activityFile, { activities: [] });
    const nextNum = (data.activities || []).length + 1;
    const record = {
      taskId: entry.taskId || `TASK-${String(nextNum).padStart(4, '0')}`,
      date: entry.date || new Date().toISOString().slice(0, 10),
      area: entry.area || 'Job applications',
      task: entry.task || '',
      status: entry.status || 'In Progress',
      actionsTaken: entry.actionsTaken || '',
      result: entry.result || '',
      nextStep: entry.nextStep || '',
      link: entry.link || '',
      lastUpdated: new Date().toISOString().slice(0, 10)
    };
    data.activities.push(record);
    this._writeJson(this.activityFile, data);
    this._renderDerivedFiles();
    return record;
  }

  listConfirmedAnswers() {
    const data = this._readJson(this.answersFile, { answers: [] });
    return data.answers || [];
  }

  appendConfirmedAnswer(entry) {
    const data = this._readJson(this.answersFile, { answers: [] });
    data.answers.push({
      question: entry.question,
      answer: entry.answer,
      scope: entry.scope || 'Applications generally',
      confirmedOn: entry.confirmedOn || new Date().toISOString().slice(0, 10),
      source: entry.source || 'Direct user input',
      reuseRule: entry.reuseRule || ''
    });
    this._writeJson(this.answersFile, data);
    return data.answers.length;
  }

  saveCvFile(sourcePath, targetFilename) {
    fs.mkdirSync(this.cvDir, { recursive: true });
    const dest = path.join(this.cvDir, targetFilename);
    if (path.resolve(sourcePath) !== path.resolve(dest)) {
      fs.copyFileSync(sourcePath, dest);
    }
    return { backend: 'local', path: dest };
  }

  getSummaryCounts() {
    const jobs = this.listJobs();
    const applied = jobs.filter((j) => /applied/i.test(j.status || '') && !/already applied|duplicate/i.test(j.status || ''));
    const ready = jobs.filter((j) => /ready|staged/i.test(j.status || ''));
    const blocked = jobs.filter((j) => /blocked|hcaptcha|captcha/i.test(j.status || ''));
    const closed = jobs.filter((j) => /closed|expired|skipped/i.test(j.status || ''));
    return {
      total: jobs.length,
      aboveThreshold90: jobs.filter((j) => Number(j.score) >= 90).length,
      applied: applied.length,
      ready: ready.length,
      blocked: blocked.length,
      closed: closed.length
    };
  }

  _renderDerivedFiles() {
    const jobs = this._readJson(this.jobsFile, { jobs: [] }).jobs || [];
    const headers = ['id', 'region', 'company', 'title', 'location', 'score', 'status', 'link', 'cvFile', 'updatedAt'];
    const csvLines = [headers.join(',')];
    for (const j of jobs) {
      csvLines.push(headers.map((h) => escapeCsvCell(j[h])).join(','));
    }
    fs.writeFileSync(this.csvFile, csvLines.join('\n') + '\n', 'utf8');

    const activities = this._readJson(this.activityFile, { activities: [] }).activities || [];
    const counts = this.getSummaryCounts();
    const mdLines = [
      '# Production Tracker (Local Fallback)',
      '',
      `Updated: ${new Date().toISOString()}`,
      '',
      `- Total Tracked Jobs: ${counts.total}`,
      `- Applied: ${counts.applied} | Ready: ${counts.ready} | Blocked: ${counts.blocked} | Closed/Skipped: ${counts.closed}`,
      '',
      '## Task Log',
      '',
      '| Task ID | Date | Area | Task | Status | Result | Next Step |',
      '|---|---|---|---|---|---|---|',
      ...activities.map(
        (a) =>
          `| ${a.taskId} | ${a.date} | ${a.area} | ${String(a.task).replace(/\|/g, '/')} | ${a.status} | ${String(a.result).replace(/\|/g, '/')} | ${String(a.nextStep).replace(/\|/g, '/')} |`
      ),
      ''
    ];
    fs.writeFileSync(this.markdownTrackerFile, mdLines.join('\n'), 'utf8');
  }
}

function createStorageAdapter(cfg) {
  const backend = (cfg?.storageBackend || 'local').toLowerCase();
  if (backend === 'google') {
    const hasSheets = Boolean(cfg?.google?.sheets?.primary || cfg?.google?.sheets?.secondary);
    if (hasSheets) {
      // Lazy-load Google Sheets/Drive adapter; falls back cleanly if credentials missing
      const sheetsHelper = require('../originals_sanitized/sheets_helper');
      return {
        mode: 'google',
        updateStatus: (region, id, status) => sheetsHelper.updateStatus(region, id, status, cfg),
        getConfirmedAnswersAndCounts: sheetsHelper.getConfirmedAnswersAndCounts,
        getAccessToken: sheetsHelper.getAccessToken,
        localMirror: new LocalStorageAdapter(cfg)
      };
    }
    console.warn('[storage] STORAGE_BACKEND=google requested, but Google Sheet IDs are missing. Falling back to local folder storage.');
  }
  const local = new LocalStorageAdapter(cfg);
  local.init();
  return {
    mode: 'local',
    listJobs: (r) => local.listJobs(r),
    hasDuplicateJob: (j) => local.hasDuplicateJob(j),
    upsertJob: (j) => local.upsertJob(j),
    updateStatus: async (r, id, st, proof) => local.updateStatus(r, id, st, proof),
    appendActivity: (e) => local.appendActivity(e),
    listConfirmedAnswers: () => local.listConfirmedAnswers(),
    appendConfirmedAnswer: (e) => local.appendConfirmedAnswer(e),
    saveCvFile: (src, name) => local.saveCvFile(src, name),
    getSummaryCounts: () => local.getSummaryCounts(),
    localMirror: local
  };
}

module.exports = {
  LocalStorageAdapter,
  createStorageAdapter
};
