const { fetchMember, randomInt } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
module.exports = {
  name: 'howgay', description: 'Gay meter (joke)', category: 'fun', aliases: ['gay'], usage: '[member]', permLevel: 'user',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    return message.reply({ embeds: [info(`**${member.user.username}** is **${randomInt(0, 100)}%** gay.`)] });
  },
};
