const { fetchMember, pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');

const lines = [
  'tu rends ce serveur bien plus agréable.',
  't\'as une vibe de légende.',
  'ton énergie est contagieuse (dans le bon sens).',
  't\'es clairement quelqu\'un de précieux ici.',
  'continuer d\'être toi, ça déchire.',
];

module.exports = {
  name: 'compliment',
  description: 'Fait un compliment',
  category: 'fun',
  aliases: ['nice'],
  usage: '[membre]',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    return message.reply({ embeds: [info(`💖 ${member}, ${pick(lines)}`)] });
  },
};
