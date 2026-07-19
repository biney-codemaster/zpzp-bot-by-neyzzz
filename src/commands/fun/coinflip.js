const { pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
module.exports = {
  name: 'coinflip', description: 'Flip a coin', category: 'fun', aliases: ['flip', 'coin'], permLevel: 'user',
  async execute(client, message) {
    return message.reply({ embeds: [info(`Result: **${pick(['Heads', 'Tails'])}**`)] });
  },
};
