const { error } = require('../../utils/embeds');
const {
  buildHomeEmbed,
  buildCommandEmbed,
  buildHelpComponents,
} = require('../../utils/helpMenu');

module.exports = {
  name: 'help',
  description: "Ouvre le menu d'aide interactif",
  category: 'utility',
  aliases: ['aide', 'commands', 'cmds', 'menu'],
  usage: '[commande]',
  cooldown: 3,
  async execute(client, message, args) {
    const prefix = client.db.getPrefix(message.guild.id);

    if (args[0]) {
      const name = args[0].toLowerCase();
      const command =
        client.commands.get(name) ||
        client.commands.get(client.aliases.get(name));

      if (!command) {
        return message.reply({ embeds: [error('Commande introuvable.')] });
      }

      if (
        command.ownerOnly &&
        !client.config.ownerIds.includes(message.author.id)
      ) {
        return message.reply({ embeds: [error('Commande introuvable.')] });
      }

      return message.reply({
        embeds: [buildCommandEmbed(client, command, prefix)],
      });
    }

    return message.reply({
      embeds: [buildHomeEmbed(client, message.author, prefix)],
      components: buildHelpComponents(client, message.author.id),
    });
  },
};
