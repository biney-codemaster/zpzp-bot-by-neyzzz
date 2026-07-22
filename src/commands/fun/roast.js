const { fetchMember, pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
const { ROASTS } = require('../../utils/funContent');

module.exports = {
  name: 'roast',
  description: 'Roast someone (joke)',
  category: 'fun',
  usage: '[member]',
  permLevel: 'user',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    return message.reply({
      embeds: [info(`${member}, ${pick(ROASTS)}`)],
    });
  },
};
