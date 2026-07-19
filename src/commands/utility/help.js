const { error } = require('../../utils/embeds');
const { buildHomeEmbed, buildCommandEmbed, buildHelpComponents } = require('../../utils/helpMenu');

module.exports = {
  name: 'help',
  description: 'Open the interactive help menu',
  category: 'utility',
  aliases: ['commands', 'cmds', 'menu'],
  usage: '[command]',
  permLevel: 'user',
  async execute(client, message, args) {
    const prefix = client.db.getPrefix(message.guild.id);
    if (args[0]) {
      const key = args[0].toLowerCase();
      const command = client.commands.get(key) || client.commands.get(client.aliases.get(key));
      if (!command || ((command.ownerOnly || command.permLevel === 'owner') && !client.config.ownerIds.includes(message.author.id))) {
        return message.reply({ embeds: [error('Command not found.')] });
      }
      return message.reply({ embeds: [buildCommandEmbed(client, command, prefix)] });
    }
    return message.reply({
      embeds: [buildHomeEmbed(client, message.author, prefix)],
      components: buildHelpComponents(client, message.author.id),
    });
  },
};
