const { pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
const jokes = [
  'Pourquoi les plongeurs plongent-ils en arrière ? Sinon ils tombent dans le bateau.',
  'Oct 31 = Dec 25.',
  "Qu'est-ce qu'un crocodile qui survole une banque ? Un cash odile.",
  'Pourquoi les poissons détestent Discord ? Trop de serveurs.',
  "J'ai une blague sur les ascenseurs… elle ne marche pas entre les étages.",
];
module.exports = {
  name: 'joke', description: 'Raconte une blague', category: 'fun', aliases: ['blague'], permLevel: 'user',
  async execute(client, message) {
    return message.reply({ embeds: [info(pick(jokes), 'Blague')] });
  },
};
