const { fetchMember, pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
const lines = ['tu rends ce serveur plus agréable.', "t'as une vibe de légende.", 'continue exactement comme ça.'];
module.exports = {
  name: 'compliment', description: 'Compliment', category: 'fun', usage: '[membre]', permLevel: 'user',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    return message.reply({ embeds: [info(`${member}, ${pick(lines)}`)] });
  },
};
