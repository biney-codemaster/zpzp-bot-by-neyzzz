const { fetchMember, pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');

const roasts = [
  'Tu es la raison pour laquelle les mode avion existent.',
  'Ton Wi-Fi a plus de présence que toi.',
  'Même ChatGPT refuse de te répondre parfois.',
  'Tu as le charisme d\'une erreur 404.',
  'Si la médiocrité était un sport, tu serais professionnel.',
  'Ton aura buffer tellement fort que Discord lag.',
];

module.exports = {
  name: 'roast',
  description: 'Roast quelqu\'un (humour)',
  category: 'fun',
  usage: '[membre]',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    return message.reply({ embeds: [info(`🔥 ${member}, ${pick(roasts)}`)] });
  },
};
