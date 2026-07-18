const { success } = require('../../utils/embeds');

module.exports = {
  name: 'afk',
  description: 'Te met AFK',
  category: 'utility',
  usage: '[raison]',
  async execute(client, message, args) {
    const reason = args.join(' ') || 'AFK';
    client.db.setAfk(message.guild.id, message.author.id, reason.slice(0, 200));
    return message.reply({ embeds: [success(`Tu es maintenant AFK : ${reason.slice(0, 200)}`)] });
  },
};
