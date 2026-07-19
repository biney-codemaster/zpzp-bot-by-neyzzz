const { fetchMember, pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
const roasts = ['your Wi-Fi has more presence than you.', 'you have the charisma of a 404 error.', 'even airplane mode finds you distant.', 'your aura buffers too hard.'];
module.exports = {
  name: 'roast', description: 'Roast someone (joke)', category: 'fun', usage: '[member]', permLevel: 'user',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    return message.reply({ embeds: [info(`${member}, ${pick(roasts)}`)] });
  },
};
