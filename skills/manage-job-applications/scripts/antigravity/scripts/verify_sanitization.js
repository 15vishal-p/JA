/**
 * SECURITY & SYNTAX VERIFICATION SCRIPT: scripts/verify_sanitization.js
 * - `--syntax-only`: runs `node --check` on every .js file in the kit.
 * - `--scan`: scans every text file in the repository for accidental PII, OAuth secrets,
 *   passwords, personal email addresses, phone numbers, real device paths, or private IDs.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const IGNORE_DIRS = new Set(['node_modules', '.git', 'data', 'artifacts', 'cvs']);
const ALLOWED_EMAIL_DOMAINS = ['@example.com'];

const FORBIDDEN_PATTERNS = [
  { name: 'Google OAuth Client Secret', regex: /GOCSPX-[A-Za-z0-9_-]+/g },
  { name: 'Google OAuth Client ID', regex: /\d{8,}-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com/g },
  { name: 'OAuth Refresh Token literal', regex: /1\/\/0[A-Za-z0-9_-]{20,}/g },
  { name: 'Personal Windows Home Path', regex: /[A-Za-z]:\\Users\\(?!(?:example|runneradmin|user|<USER>))[A-Za-z0-9._-]+/gi },
  { name: 'Personal Google Drive Desktop Path', regex: /G:\\My Drive\\/gi },
  { name: 'Hardcoded Gmail Address', regex: /[A-Za-z0-9._%+-]+@(?!example\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { name: 'E.164 Real Phone Pattern (non-zeroed)', regex: /\+(?:421|91|49)\s*[1-9]\d{6,}/g },
  { name: 'Private Google Sheet/Doc ID literal', regex: /\b1[A-Za-z0-9_-]{40,}\b/g }
];

const ALLOWLIST_EMAIL_CONTEXT = [
  'playwright-core',
  'example.com',
  'boards-api.greenhouse.io',
  'api.ashbyhq.com',
  'api.smartrecruiters.com',
  'schema.org'
];

function walkFiles(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function checkSyntax(files) {
  const jsFiles = files.filter((f) => f.endsWith('.js'));
  for (const f of jsFiles) {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  }
  console.log(`[syntax] Passed node --check on ${jsFiles.length} JavaScript files.`);
}

function scanPiiAndSecrets(files) {
  const findings = [];
  for (const full of files) {
    if (full.endsWith('.png') || full.endsWith('.pdf') || full.endsWith('.zip')) {
      findings.push({ file: path.relative(ROOT, full), rule: 'Binary artifact not permitted in source repo', match: path.basename(full) });
      continue;
    }
    if (path.resolve(full) === path.resolve(__filename)) continue;
    const text = fs.readFileSync(full, 'utf8');
    const rel = path.relative(ROOT, full);

    for (const rule of FORBIDDEN_PATTERNS) {
      rule.regex.lastIndex = 0;
      let m;
      while ((m = rule.regex.exec(text)) !== null) {
        const val = m[0];
        if (rule.name === 'Hardcoded Gmail Address' && ALLOWED_EMAIL_DOMAINS.some((d) => val.endsWith(d))) continue;
        if (ALLOWLIST_EMAIL_CONTEXT.some((ctx) => val.includes(ctx))) continue;
        // Skip SVG path data or harmless hash strings unless matching Drive ID shape (length 44 with dash/underscore or spreadsheet URL)
        if (rule.name === 'Private Google Sheet/Doc ID literal') {
          const lineStart = text.lastIndexOf('\n', m.index) + 1;
          const lineEnd = text.indexOf('\n', m.index);
          const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
          if (!/(sheet|drive|spreadsheets|document|folder|docs\.google|drive\.google|gid=|SHEET_ID|DOC_ID)/i.test(line)) {
            continue;
          }
        }
        findings.push({ file: rel, rule: rule.name, match: val.slice(0, 60) });
      }
    }
  }

  if (findings.length > 0) {
    console.error('[scan:pii] FAILED! Potential secrets/PII detected:');
    for (const f of findings) {
      console.error(`  - ${f.file} [${f.rule}]: ${f.match}`);
    }
    process.exit(1);
  }
  console.log(`[scan:pii] Passed cleanly across ${files.length} files (0 secrets, 0 PII, 0 binary artifacts).`);
}

const files = walkFiles(ROOT);
const args = process.argv.slice(2);
if (args.includes('--syntax-only')) {
  checkSyntax(files);
} else if (args.includes('--scan')) {
  scanPiiAndSecrets(files);
} else {
  checkSyntax(files);
  scanPiiAndSecrets(files);
}
