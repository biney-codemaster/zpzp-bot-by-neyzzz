const { info, error } = require('../../utils/embeds');
module.exports = {
  name: 'reverse', description: 'Inverse un texte', category: 'fun', usage: '<texte>', permLevel: 'user',
  async execute(client, message, args) {
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [error('Donne un texte.')] });
    return message.reply({ embeds: [info(text.split('').reverse().join(''))] });
  },
};
