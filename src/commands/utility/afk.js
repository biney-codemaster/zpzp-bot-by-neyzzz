const { success } = require('../../utils/embeds');

module.exports = {
  name: 'afk',
  description: 'Te met AFK',
  category: 'utility',
  usage: '[raison]',
  permLevel: 'user',
  async execute(client, message, args) {
    const reason = (args.join(' ') || 'AFK').slice(0, 200);
    client.db.setAfk(message.guild.id, message.author.id, reason);
    return message.reply({ embeds: [success(`AFK activé : ${reason}`)] });
  },
};
