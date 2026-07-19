const fs = require('fs');
const path = require('path');

function loadEvents(client) {
  const dir = path.join(__dirname, '../events');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));

  for (const file of files) {
    const event = require(path.join(dir, file));
    if (!event?.name || typeof event.execute !== 'function') {
      console.warn(`[EVT] Ignoré ${file}`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args) => event.execute(client, ...args));
    }
  }

  console.log(`[EVT] ${files.length} événements chargés`);
}

module.exports = { loadEvents };
