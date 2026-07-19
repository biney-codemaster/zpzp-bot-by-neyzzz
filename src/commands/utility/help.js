const { error } = require('../../utils/embeds');
const { buildHomeEmbed, buildCommandEmbed, buildHelpComponents } = require('../../utils/helpMenu');

module.exports = {
  name: 'help',
  description: "Ouvre le menu d'aide interactif",
  category: 'utility',
  aliases: ['aide', 'commands', 'cmds', 'menu'],
  usage: '[commande]',
  permLevel: 'user',
  async execute(client, message, args) {
    const prefix = client.db.getPrefix(message.guild.id);
    if (args[0]) {
      const key = args[0].toLowerCase();
      const command = client.commands.get(key) || client.commands.get(client.aliases.get(key));
      if (!command || ((command.ownerOnly || command.permLevel === 'owner') && !client.config.ownerIds.includes(message.author.id))) {
        return message.reply({ embeds: [error('Commande introuvable.')] });
      }
      return message.reply({ embeds: [buildCommandEmbed(client, command, prefix)] });
    }
    return message.reply({
      embeds: [buildHomeEmbed(client, message.author, prefix)],
      components: buildHelpComponents(client, message.author.id),
    });
  },
};
