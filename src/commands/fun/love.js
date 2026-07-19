const { fetchMember, randomInt } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');
module.exports = {
  name: 'love', description: 'Compatibilité amoureuse', category: 'fun', aliases: ['ship'], usage: '<membre> [membre]', permLevel: 'user',
  async execute(client, message, args) {
    let p1 = message.member;
    let p2 = await fetchMember(message, args[0]);
    if (args[1]) { p1 = await fetchMember(message, args[0]); p2 = await fetchMember(message, args[1]); }
    if (!p1 || !p2) return message.reply({ embeds: [error('Mentionne une ou deux personnes.')] });
    const score = randomInt(0, 100);
    const filled = Math.round(score / 10);
    const bar = '♥'.repeat(filled) + '♡'.repeat(10 - filled);
    return message.reply({ embeds: [info(`${p1} × ${p2}\n${bar}\n**${score}%**`)] });
  },
};
