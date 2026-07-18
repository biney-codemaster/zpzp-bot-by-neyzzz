const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'));
    for (const file of files) {
      const command = require(path.join(categoryPath, file));
      if (!command?.name || typeof command.execute !== 'function') {
        console.warn(`[CMD] Ignoré: ${category}/${file}`);
        continue;
      }
      command.category = command.category || category;
      client.commands.set(command.name, command);
      if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          client.aliases.set(alias, command.name);
        }
      }
    }
  }

  console.log(`[CMD] ${client.commands.size} commandes chargées.`);
}

module.exports = { loadCommands };
