/**
 * SANITIZED ORIGINAL SCRIPT: cv_generator_compliant.js
 * Original role: Role-tailored A4 HTML-to-PDF CV generator with dynamic city header matching.
 * Modifications for public reuse:
 *   - Replaced hardcoded candidate PII, employer history, education, and project metrics
 *     with dynamic rendering from config/profile.json and config/rules.json.
 *   - Replaced device-specific Chrome/Playwright paths and local cloud-sync CV directory
 *     with src/lib/config.js, src/lib/browser.js, and src/lib/storage.js.
 */
const fs = require('fs');
const path = require('path');
const { loadConfig, ensureDirs } = require('../lib/config');
const { launchBrowser } = require('../lib/browser');
const { createStorageAdapter } = require('../lib/storage');

const DEFAULT_CITY_MAP = [
  ['berlin', 'Berlin, Germany'],
  ['munich', 'Munich, Germany'],
  ['münchen', 'Munich, Germany'],
  ['erlangen', 'Munich, Germany'],
  ['frankfurt', 'Frankfurt, Germany'],
  ['walldorf', 'Walldorf, Germany'],
  ['hamburg', 'Hamburg, Germany'],
  ['cologne', 'Cologne, Germany'],
  ['köln', 'Cologne, Germany'],
  ['stuttgart', 'Stuttgart, Germany'],
  ['düsseldorf', 'Düsseldorf, Germany'],
  ['amsterdam', 'Amsterdam, Netherlands'],
  ['eindhoven', 'Eindhoven, Netherlands'],
  ['veldhoven', 'Eindhoven, Netherlands'],
  ['rotterdam', 'Rotterdam, Netherlands'],
  ['tallinn', 'Tallinn, Estonia'],
  ['barcelona', 'Barcelona, Spain'],
  ['madrid', 'Madrid, Spain'],
  ['luxembourg', 'Luxembourg City, Luxembourg'],
  ['stockholm', 'Stockholm, Sweden'],
  ['gothenburg', 'Gothenburg, Sweden'],
  ['paris', 'Paris, France'],
  ['copenhagen', 'Copenhagen, Denmark'],
  ['helsinki', 'Helsinki, Finland'],
  ['sofia', 'Sofia, Bulgaria'],
  ['vienna', 'Vienna, Austria'],
  ['wien', 'Vienna, Austria'],
  ['warsaw', 'Warsaw, Poland'],
  ['krakow', 'Kraków, Poland'],
  ['prague', 'Prague, Czech Republic'],
  ['bratislava', 'Bratislava, Slovakia'],
  ['košice', 'Košice, Slovakia'],
  ['kosice', 'Košice, Slovakia']
];

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveCityHeader(locationStr = '', rules = null, fallbackCity = null) {
  const s = (locationStr || '').toLowerCase();
  const customMap = (rules?.localization?.cityMap || []).map((entry) => [entry.pattern, entry.header]);
  const mapToSearch = customMap.length ? customMap : DEFAULT_CITY_MAP;

  for (const [patternOrKey, target] of mapToSearch) {
    if (customMap.length) {
      if (new RegExp(patternOrKey, 'i').test(s)) return target;
    } else if (s.includes(patternOrKey)) {
      return target;
    }
  }
  if (/germany|deutschland/.test(s)) return 'Berlin, Germany';
  if (/netherlands/.test(s)) return 'Amsterdam, Netherlands';
  if (/slovakia/.test(s)) return 'Bratislava, Slovakia';
  if (/bulgaria/.test(s)) return 'Sofia, Bulgaria';
  return fallbackCity || rules?.localization?.defaultFallbackCity || 'Bratislava, Slovakia';
}

function formatDateRange(item) {
  if (item.startDate && item.endDate) return `${item.startDate} – ${item.endDate}`;
  const start = item.startMonth && item.startYear ? `${item.startMonth}/${item.startYear}` : '';
  const end = item.currentlyWorkHere ? 'Present' : (item.endMonth && item.endYear ? `${item.endMonth}/${item.endYear}` : '');
  return [start, end].filter(Boolean).join(' – ');
}

function buildCompliantHtml({
  headline,
  summary,
  cityHeader,
  includeEtlProject = true,
  profile = null
}) {
  const cfgProfile = profile || loadConfig().profile;
  const cand = cfgProfile.candidate || {};
  const tpl = cfgProfile.cvTemplate || {};

  const fullName = cand.fullName || 'Candidate Name';
  const phone = cand.phone || '+000 000000000';
  const email = cand.email || 'applicant@example.com';
  const linkedinLabel = cand.linkedinLabel || cand.linkedinUrl || 'linkedin.com/in/example';
  const workAuthSummary = cand.workAuthorizationNote || '';

  const experienceHtml = (tpl.experience || [])
    .map(
      (exp) => `
  <div class="item">
    <div class="item-head">
      <div class="item-title">${escapeHtml(exp.title)} | <span class="company">${escapeHtml(exp.company)}</span></div>
      <div class="item-meta">${escapeHtml(formatDateRange(exp))} | ${escapeHtml(exp.location)}</div>
    </div>
    <ul>
      ${(exp.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('\n      ')}
    </ul>
  </div>`
    )
    .join('\n');

  const educationHtml = (tpl.education || [])
    .map(
      (edu) => `
  <div class="item">
    <div class="item-head">
      <div class="item-title">${escapeHtml(edu.degree)} — ${escapeHtml(edu.fieldOfStudy)}${edu.gpa ? ` (${escapeHtml(edu.gpa)})` : ''}</div>
      <div class="item-meta">${escapeHtml(formatDateRange(edu))} | ${escapeHtml(edu.location)}</div>
    </div>
    <div style="font-size: 9pt; color: #334155;">${escapeHtml(edu.institution)}${edu.details ? ` — ${escapeHtml(edu.details)}` : ''}</div>
  </div>`
    )
    .join('\n');

  const visibleProjects = (tpl.projects || []).filter((p) => includeEtlProject || !p.includeWhenTechnical);
  const projectHtml = visibleProjects.length
    ? `<h2>Projects</h2>\n${visibleProjects
        .map(
          (proj) => `  <div class="item">
    <div class="item-head"><div class="item-title">${escapeHtml(proj.name)}</div></div>
    <ul>
      ${(proj.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('\n      ')}
    </ul>
  </div>`
        )
        .join('\n')}`
    : '';

  const competenciesText = (tpl.coreCompetencies || []).map(escapeHtml).join(' &bull; ');
  const languagesText = (tpl.languages || []).map((l) => `${escapeHtml(l.name)}: ${escapeHtml(l.level)}`).join(' &bull; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 11mm 13mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Segoe UI", Arial, Helvetica, sans-serif;
    color: #1e293b;
    font-size: 9.2pt;
    line-height: 1.38;
  }
  .header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 7px;
    margin-bottom: 9px;
  }
  .name {
    font-size: 19pt;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .headline {
    font-size: 10pt;
    font-weight: 600;
    color: #1d4ed8;
    margin-top: 2px;
  }
  .contact {
    font-size: 8.5pt;
    color: #334155;
    margin-top: 4px;
  }
  .contact span { margin-right: 10px; }
  h2 {
    font-size: 9.8pt;
    font-weight: 700;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 2px;
    margin-top: 9px;
    margin-bottom: 5px;
  }
  .summary {
    font-size: 9pt;
    color: #1e293b;
    text-align: justify;
  }
  .skills-line {
    font-size: 8.8pt;
    line-height: 1.45;
  }
  .item { margin-bottom: 7px; }
  .item-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .item-title {
    font-weight: 700;
    font-size: 9.4pt;
    color: #0f172a;
  }
  .item-meta {
    font-size: 8.4pt;
    color: #475569;
    font-weight: 600;
  }
  .company {
    font-size: 8.8pt;
    font-weight: 600;
    color: #1e40af;
  }
  ul { padding-left: 15px; margin-top: 2px; }
  li { margin-bottom: 2px; }
</style>
</head>
<body>
  <div class="header">
    <div class="name">${escapeHtml(fullName)}</div>
    <div class="headline">${escapeHtml(headline || tpl.defaultHeadline)}</div>
    <div class="contact">
      <span><strong>Location:</strong> ${escapeHtml([cand.homeCity, cand.homeCountry].filter(Boolean).join(', '))}${cityHeader ? ` | Target / relocation preference: ${escapeHtml(cityHeader)}` : ''}</span> |
      <span><strong>Phone:</strong> ${escapeHtml(phone)}</span> |
      <span><strong>Email:</strong> ${escapeHtml(email)}</span> |
      <span>${escapeHtml(linkedinLabel)}</span>
    </div>
    ${workAuthSummary ? `<div class="contact" style="margin-top: 2px;"><strong>Work Authorization / Mobility:</strong> ${escapeHtml(workAuthSummary)}</div>` : ''}
  </div>

  <h2>Profile</h2>
  <p class="summary">${escapeHtml(summary || tpl.defaultSummary)}</p>

  <h2>Professional Experience</h2>
  ${experienceHtml}

  <h2>Education</h2>
  ${educationHtml}

  ${projectHtml}

  <h2>Skills &amp; Languages</h2>
  <div class="skills-line">
    <strong>Core Competencies:</strong> ${competenciesText}<br>
    <strong>Languages:</strong> ${languagesText}${tpl.additionalNote ? ` &bull; ${escapeHtml(tpl.additionalNote)}` : ''}
  </div>
</body>
</html>`;
}

async function generateCompliantCV({
  filename,
  headline,
  summary,
  location,
  includeEtlProject = true,
  config = null
}) {
  const cfg = config || loadConfig();
  ensureDirs(cfg);

  const cityHeader = resolveCityHeader(
    location,
    cfg.rules,
    [cfg.profile.candidate?.homeCity, cfg.profile.candidate?.homeCountry].filter(Boolean).join(', ')
  );
  const html = buildCompliantHtml({
    headline,
    summary,
    cityHeader,
    includeEtlProject,
    profile: cfg.profile
  });

  const outPath = path.join(cfg.paths.cvOutputDir, filename);
  const browser = await launchBrowser(cfg, { headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
    });
  } finally {
    await browser.close();
  }

  const storage = createStorageAdapter(cfg);
  if (storage.mode === 'local') {
    storage.saveCvFile(outPath, filename);
  }
  const bytes = fs.statSync(outPath).size;
  console.log(`Generated CV: ${filename} (${bytes} bytes) | CityHeader="${cityHeader}" -> ${outPath}`);
  return outPath;
}

module.exports = {
  resolveCityHeader,
  buildCompliantHtml,
  generateCompliantCV,
  formatDateRange
};
