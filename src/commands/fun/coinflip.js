const { pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
module.exports = {
  name: 'coinflip', description: 'Pile ou face', category: 'fun', aliases: ['pf'], permLevel: 'user',
  async execute(client, message) {
    return message.reply({ embeds: [info(`Résultat : **${pick(['Pile', 'Face'])}**`)] });
  },
};
