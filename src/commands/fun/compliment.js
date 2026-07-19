const { fetchMember, pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
const lines = ['you make this server better.', 'you have legendary vibes.', 'keep doing exactly what you are doing.'];
module.exports = {
  name: 'compliment', description: 'Compliment someone', category: 'fun', usage: '[member]', permLevel: 'user',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    return message.reply({ embeds: [info(`${member}, ${pick(lines)}`)] });
  },
};
