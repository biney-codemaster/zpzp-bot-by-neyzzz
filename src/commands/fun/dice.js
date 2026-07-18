const { randomInt } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');

module.exports = {
  name: 'dice',
  description: 'Lance un dé',
  category: 'fun',
  aliases: ['dé', 'de', 'roll'],
  usage: '[faces]',
  async execute(client, message, args) {
    const faces = Number(args[0]) || 6;
    if (faces < 2 || faces > 1000) return message.reply({ embeds: [error('Entre 2 et 1000 faces.')] });
    return message.reply({ embeds: [info(`🎲 Tu as obtenu **${randomInt(1, faces)}** (dé à ${faces} faces)`)] });
  },
};
