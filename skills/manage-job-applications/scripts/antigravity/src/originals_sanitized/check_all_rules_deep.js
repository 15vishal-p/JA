// Portal-specific imported adapter: review mappings and host policy before use.
if (require.main === module && process.env.JOBKIT_ENABLE_EXPERIMENTAL !== '1') {
  throw new Error('Portal adapter disabled. Review source and configuration before setting JOBKIT_ENABLE_EXPERIMENTAL=1.');
}
/**
 * SANITIZED ORIGINAL SCRIPT: check_all_rules_deep.js
 * Original role: Inspects Google Drive recent modifications, shared-with-me files, folder trees,
 * and multi-tab Google Docs (`includeTabsContent=true`) to ensure standing rules from all
 * collaborating AI assistants stay synchronized.
 * Modifications for public reuse:
 *   - Stripped personal Drive folder IDs, private Google Doc IDs, and user Drive emails.
 *   - Driven by `DRIVE_ROOT_FOLDER_ID` and `--doc-ids=ID1,ID2` in Google mode, or lists
 *     local rule/config files in Local mode.
 */
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../lib/config');
const { getAccessToken } = require('./sheets_helper');

async function req(url, tok) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

function extractTextFromElements(elements, out = []) {
  if (!Array.isArray(elements)) return out;
  for (const el of elements) {
    if (el.paragraph?.elements) {
      let line = '';
      for (const pe of el.paragraph.elements) {
        if (pe.textRun?.content) line += pe.textRun.content;
      }
      if (line) out.push(line);
    } else if (el.table?.tableRows) {
      for (const row of el.table.tableRows) {
        const cells = (row.tableCells || []).map((c) => extractTextFromElements(c.content, []).join('').trim());
        out.push('| ' + cells.join(' | ') + ' |');
      }
    }
  }
  return out;
}

function dumpTabs(tabs, prefix = '') {
  for (const t of tabs || []) {
    const props = t.tabProperties || {};
    console.log(`\n--- TAB ${prefix}[${props.tabId}] title=${JSON.stringify(props.title)} ---`);
    const body = t.documentTab?.body?.content;
    console.log(extractTextFromElements(body).join(''));
    if (t.childTabs?.length) dumpTabs(t.childTabs, prefix + '  ');
  }
}

(async () => {
  const cfg = loadConfig();

  if (cfg.storageBackend !== 'google') {
    console.log('=== LOCAL MODE: RULE & CONFIG FILES ===');
    console.log('Rules keys:', Object.keys(cfg.rules));
    console.log('Confirmed answers count:', cfg.answers.length);
    console.log('Local data dir:', cfg.paths.localDataDir);
    return;
  }

  const tok = await getAccessToken(cfg);
  const recent = await req(
    'https://www.googleapis.com/drive/v3/files?q=trashed=false&orderBy=modifiedTime desc&pageSize=15&fields=files(id,name,mimeType,modifiedTime)',
    tok
  );
  console.log('=== DRIVE RECENT 15 ===');
  for (const f of recent.data.files || []) {
    console.log(`${f.modifiedTime} | ${f.id} | ${f.mimeType} | ${f.name}`);
  }

  if (cfg.google.rootFolderId) {
    const ch = await req(
      `https://www.googleapis.com/drive/v3/files?q='${cfg.google.rootFolderId}' in parents and trashed=false&pageSize=50&fields=files(id,name,mimeType,modifiedTime)`,
      tok
    );
    console.log(`\n=== ROOT FOLDER CHILDREN (${(ch.data.files || []).length}) ===`);
    for (const f of ch.data.files || []) {
      console.log(`${f.modifiedTime} | ${f.id} | ${f.mimeType} | ${f.name}`);
    }
  }

  const docIdsArg = process.argv.find((a) => a.startsWith('--doc-ids='))?.replace('--doc-ids=', '') || '';
  for (const did of docIdsArg.split(',').map((s) => s.trim()).filter(Boolean)) {
    const d = await req(`https://docs.googleapis.com/v1/documents/${did}?includeTabsContent=true`, tok);
    console.log(`\n=== DOC: ${d.data?.title || did} (${did}) ===`);
    if (d.data?.tabs?.length) dumpTabs(d.data.tabs);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

module.exports = { extractTextFromElements, dumpTabs };
