const { fetchMember } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');

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
    if (!cases.length) return message.reply({ embeds: [info(`No history for **${member.user.tag}**.`)] });
    const list = cases.map((c) => {
      const extra = c.extra ? `\n_${c.extra}_` : '';
      return `\`#${c.id}\` **${c.action}** — <t:${Math.floor(c.created_at / 1000)}:R> — <@${c.moderator_id}>\n${c.reason || '-'}${extra}`;
    }).join('\n\n');
    return message.reply({ embeds: [info(list, `History — ${member.user.tag}`)] });
  },
};
