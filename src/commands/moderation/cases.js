const { fetchMember } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');

module.exports = {
  name: 'cases',
  description: "Historique de modération d'un membre",
  category: 'moderation',
  aliases: ['modlogs', 'historique'],
  usage: '<membre>',
  permLevel: 'mod',
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    if (!member) return message.reply({ embeds: [error('Membre invalide.')] });
    const cases = client.db.getModCases(message.guild.id, member.id, 12);
    if (!cases.length) return message.reply({ embeds: [info(`Aucun historique pour **${member.user.tag}**.`)] });
    const list = cases.map((c) => `\`#${c.id}\` **${c.action}** — <t:${Math.floor(c.created_at / 1000)}:R> — <@${c.moderator_id}>\n${c.reason || '—'}${c.extra ? `\n_${c.extra}_` : ''}`).join('\n\n');
    return message.reply({ embeds: [info(list, `Historique — ${member.user.tag}`)] });
  },
};
