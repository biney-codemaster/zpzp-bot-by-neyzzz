const { fetchMember, randomInt } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
module.exports = {
  name: 'howgay', description: 'Gay-o-mètre (humour)', category: 'fun', aliases: ['gay'], usage: '[membre]', permLevel: 'user',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    return message.reply({ embeds: [info(`**${member.user.username}** est gay à **${randomInt(0, 100)}%**.`)] });
  },
};
