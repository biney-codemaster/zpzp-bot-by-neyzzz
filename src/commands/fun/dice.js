const { randomInt } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');
module.exports = {
  name: 'dice', description: 'Roll a die', category: 'fun', aliases: ['roll'], usage: '[sides]', permLevel: 'user',
  async execute(client, message, args) {
    const faces = Number(args[0]) || 6;
    if (faces < 2 || faces > 1000) return message.reply({ embeds: [error('Between 2 and 1000 sides.')] });
    return message.reply({ embeds: [info(`You rolled **${randomInt(1, faces)}** / ${faces}`)] });
  },
};
