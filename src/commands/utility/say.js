const { error } = require('../../utils/embeds');

module.exports = {
  name: 'say',
  description: 'Fait parler le bot',
  category: 'utility',
  usage: '<message>',
  permLevel: 'mod',
  async execute(client, message, args) {
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [error('Écris un message.')] });
    await message.delete().catch(() => null);
    return message.channel.send({ content: text.slice(0, 2000) });
  },
};
