const { fetchMember, randomInt } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');

module.exports = {
  name: 'howgay',
  description: 'Mesure le gay-o-mètre (humour)',
  category: 'fun',
  aliases: ['gay'],
  usage: '[membre]',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    const score = randomInt(0, 100);
    return message.reply({ embeds: [info(`🌈 **${member.user.username}** est gay à **${score}%** !`)] });
  },
};
