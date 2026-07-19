const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const root = path.join(__dirname, '../commands');
  let count = 0;

  for (const category of fs.readdirSync(root)) {
    const dir = path.join(root, category);
    if (!fs.statSync(dir).isDirectory()) continue;

    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
      const command = require(path.join(dir, file));
      if (!command?.name || typeof command.execute !== 'function') {
        console.warn(`[CMD] Ignoré ${category}/${file}`);
        continue;
      }

      command.category = command.category || category;
      command.permLevel = command.permLevel || 'user';
      client.commands.set(command.name, command);

      for (const alias of command.aliases || []) {
        client.aliases.set(alias, command.name);
      }
      count += 1;
    }
  }

  console.log(`[CMD] ${count} commandes chargées`);
}

module.exports = { loadCommands };
