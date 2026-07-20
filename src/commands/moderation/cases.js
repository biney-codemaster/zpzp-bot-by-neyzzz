const { fetchMember } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');
const { formatCaseRow } = require('../../utils/modlog');

module.exports = {
  name: 'cases',
  description: 'Moderation history for a member',
  category: 'moderation',
  aliases: ['modlogs', 'history'],
  usage: '<member>',
  permLevel: 'mod',
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    if (!member) return message.reply({ embeds: [error('Invalid member.')] });
    const cases = client.db.getModCases(message.guild.id, member.id, 12);
    if (!cases.length) {
      return message.reply({ embeds: [info(`No history for **${member.user.tag}**.`)] });
    }
    const list = cases.map(formatCaseRow).join('\n\n');
    return message.reply({ embeds: [info(list, `History — ${member.user.tag}`)] });
  },
};
