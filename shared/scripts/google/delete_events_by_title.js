// Delete events whose title matches any of the given substrings (case-insensitive).
// Recurring events are deleted at the series root, wiping all instances (past + future).
//
// Usage:
//   node --env-file=.env shared/scripts/google/delete_events_by_title.js "Jollibee Ministry" "Car payments"

import { gcal, log } from './_client.js';

const titles = process.argv.slice(2);
if (titles.length === 0) {
  log('FATAL: Pass one or more title substrings as arguments.');
  process.exit(1);
}

async function findMatches(titleQuery) {
  // singleEvents=false so we get recurring series roots (not expanded instances).
  // q= does a full-text search across event fields.
  const data = await gcal('/calendars/primary/events', {
    query: {
      q: titleQuery,
      singleEvents: false,
      maxResults: 250,
      showDeleted: false,
    },
  });
  const items = data.items || [];
  // Filter to exact-ish title matches (case-insensitive substring)
  const needle = titleQuery.toLowerCase();
  return items.filter((e) => (e.summary || '').toLowerCase().includes(needle));
}

async function main() {
  for (const title of titles) {
    log(`\n=== Searching for: "${title}" ===`);
    const matches = await findMatches(title);
    if (matches.length === 0) {
      log('  (no matches)');
      continue;
    }

    // Dedupe: if we get a recurring series root AND some instances, keep only the root.
    const rootIds = new Set(matches.filter((e) => e.recurrence).map((e) => e.id));
    const toDelete = matches.filter((e) => {
      // Skip instances whose parent root we already have
      if (e.recurringEventId && rootIds.has(e.recurringEventId)) return false;
      return true;
    });

    log(`  Found ${toDelete.length} item(s) to delete:`);
    for (const e of toDelete) {
      const kind = e.recurrence ? 'RECURRING SERIES' : (e.recurringEventId ? 'orphan instance' : 'single event');
      log(`    • [${kind}] ${e.id}  —  ${e.summary}`);
    }

    for (const e of toDelete) {
      try {
        await gcal(`/calendars/primary/events/${encodeURIComponent(e.id)}`, { method: 'DELETE' });
        log(`    ✓ deleted: ${e.summary} (${e.id})`);
      } catch (err) {
        log(`    ✗ FAILED to delete ${e.id}: ${err.message}`);
      }
    }
  }
  log('\nDone.');
}

main().catch((err) => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
