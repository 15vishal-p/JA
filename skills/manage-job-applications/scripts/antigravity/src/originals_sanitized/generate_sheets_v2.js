// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: generate_sheets_v2.js
 * Original role: Updates master Sponsor Directory Excel workbook (.xlsx) with newly discovered
 * employers across target hubs and rebuilds worksheet tabs.
 * Modifications for public reuse:
 *   - Replaced local temporary module path and cloud-sync workbook path with standard
 *     optional `xlsx` import and config.paths.sponsorXlsxPath.
 *   - Replaced private directory payload with configurable JSON input (`--batch=<file.json>`)
 *     plus safe placeholder examples.
 */
const fs = require('fs');
const path = require('path');
const { loadConfig, ensureDirs } = require('../lib/config');

function loadXlsx() {
  try {
    return require('xlsx');
  } catch (e) {
    throw new Error('Optional package "xlsx" is required for Excel workbook generation. Install with `npm install xlsx`.');
  }
}

const EXAMPLE_COMPANIES = [
  {
    id: 'EX-001',
    name: 'Example Cloud FinTech AB',
    hq: 'Stockholm, Sweden',
    url: 'https://careers.example.com/',
    score: 85,
    notes: 'Sample visa-sponsoring employer entry for schema demonstration.'
  }
];

function toRow(c) {
  return {
    ID: c.id,
    'Company Name': c.name,
    Status: c.status || 'Newly Discovered',
    'Headquarters / Regional Offices': c.hq,
    'Career Portal URL': c.url,
    'Sponsorship Possibility (1-100)': c.score,
    'Focus Areas & Technical Notes': c.notes
  };
}

function main() {
  const XLSX = loadXlsx();
  const cfg = loadConfig();
  ensureDirs(cfg);

  const arg = process.argv.find((a) => a.startsWith('--batch='));
  const entries = arg ? JSON.parse(fs.readFileSync(arg.replace('--batch=', ''), 'utf8')) : EXAMPLE_COMPANIES;
  const outputPath = cfg.paths.sponsorXlsxPath;

  const wb = fs.existsSync(outputPath) ? XLSX.readFile(outputPath) : XLSX.utils.book_new();
  const existingMaster = wb.Sheets['Master Directory (All)'] ? XLSX.utils.sheet_to_json(wb.Sheets['Master Directory (All)']) : [];
  const existingIds = new Set(existingMaster.map((r) => String(r.ID || '')));
  const freshRows = entries.filter((e) => !existingIds.has(e.id)).map(toRow);

  const updatedMaster = [...existingMaster, ...freshRows];
  const masterWs = XLSX.utils.json_to_sheet(updatedMaster);
  if (!wb.SheetNames.includes('Master Directory (All)')) {
    XLSX.utils.book_append_sheet(wb, masterWs, 'Master Directory (All)');
  } else {
    wb.Sheets['Master Directory (All)'] = masterWs;
  }

  XLSX.writeFile(wb, outputPath);
  console.log(`Updated workbook ${outputPath}: added ${freshRows.length} new rows (total ${updatedMaster.length}).`);
}

if (require.main === module) {
  main();
}

module.exports = { toRow };
