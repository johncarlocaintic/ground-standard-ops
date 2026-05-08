// Sanity test: list the next 10 events on your primary calendar.
// Usage:
//   node --env-file=.env shared/scripts/google/list_events.js

import { gcal, log } from './_client.js';

async function main() {
  log('Fetching next 10 upcoming events from primary calendar…');

  const data = await gcal('/calendars/primary/events', {
    query: {
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    },
  });

  const events = data.items || [];
  if (events.length === 0) {
    log('No upcoming events found.');
    return;
  }

  log(`Found ${events.length} event(s):`);
  for (const e of events) {
    const when = e.start?.dateTime || e.start?.date || '(no time)';
    log(`  • ${when}  —  ${e.summary || '(no title)'}`);
  }
}

main().catch((err) => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
