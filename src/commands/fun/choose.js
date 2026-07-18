const { pick } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');

module.exports = {
  name: 'choose',
  description: 'Choisit parmi des options',
  category: 'fun',
  aliases: ['pick', 'choix'],
  usage: '<option1 | option2 | ...>',
  async execute(client, message, args) {
    const parts = args.join(' ').split('|').map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) return message.reply({ embeds: [error('Usage : `+choose pizza | burger | tacos`')] });
    return message.reply({ embeds: [info(`🎯 Je choisis : **${pick(parts)}**`)] });
  },
};
