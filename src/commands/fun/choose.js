const { pick } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');
module.exports = {
  name: 'choose', description: 'Choose between options', category: 'fun', aliases: ['pick'], usage: '<a | b | c>', permLevel: 'user',
  async execute(client, message, args) {
    const parts = args.join(' ').split('|').map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) return message.reply({ embeds: [error('Usage: `+choose a | b | c`')] });
    return message.reply({ embeds: [info(`I choose: **${pick(parts)}**`)] });
  },
};
