const { success } = require('../../utils/embeds');
module.exports = {
  name: 'afk', description: 'Set yourself AFK', category: 'utility', usage: '[reason]', permLevel: 'user',
  async execute(client, message, args) {
    const reason = (args.join(' ') || 'AFK').slice(0, 200);
    client.db.setAfk(message.guild.id, message.author.id, reason);
    return message.reply({ embeds: [success(`AFK set: ${reason}`)] });
  },
};
