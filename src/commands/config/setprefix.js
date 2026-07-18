const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'setprefix',
  description: 'Change le préfixe du serveur',
  category: 'config',
  aliases: ['prefix'],
  usage: '<nouveau_préfixe>',
  permissions: ['ManageGuild'],
  async execute(client, message, args) {
    const prefix = args[0];
    if (!prefix || prefix.length > 5) {
      return message.reply({
        embeds: [error('Donne un préfixe (1 à 5 caractères).')],
      });
    }

    client.db.updateGuild(message.guild.id, { prefix });
    return message.reply({
      embeds: [
        success(
          `Nouveau préfixe : \`${prefix}\`\nExemple : \`${prefix}help\``
        ),
      ],
    });
  },
};
