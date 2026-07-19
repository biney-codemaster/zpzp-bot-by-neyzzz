const { info, error } = require('../../utils/embeds');
module.exports = {
  name: 'reverse', description: 'Reverse text', category: 'fun', usage: '<text>', permLevel: 'user',
  async execute(client, message, args) {
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [error('Provide some text.')] });
    return message.reply({ embeds: [info(text.split('').reverse().join(''))] });
  },
};
