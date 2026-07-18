const { fetchMember } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');

module.exports = {
  name: 'warnings',
  description: 'Affiche les avertissements d\'un membre',
  category: 'moderation',
  aliases: ['warns', 'avertissements'],
  usage: '[membre]',
  permissions: ['ModerateMembers'],
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    const warns = client.db.getWarnings(message.guild.id, member.id);
    if (!warns.length) return message.reply({ embeds: [info(`**${member.user.tag}** n\'a aucun avertissement.`)] });
    const list = warns.slice(0, 15).map((w) => `\`#${w.id}\` — <t:${Math.floor(w.created_at / 1000)}:R> — <@${w.moderator_id}>\n${w.reason}`).join('\n\n');
    return message.reply({ embeds: [info(list, `Avertissements de ${member.user.tag} (${warns.length})`)] });
  },
};
