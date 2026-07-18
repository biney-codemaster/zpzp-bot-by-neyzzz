const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'clearwarns',
  description: 'Supprime tous les avertissements d\'un membre',
  category: 'moderation',
  aliases: ['resetwarns'],
  usage: '<membre>',
  permissions: ['ModerateMembers'],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    if (!member) return message.reply({ embeds: [error('Mentionne un membre valide.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('Tu ne peux pas modérer ce membre.')] });
    const count = client.db.clearWarnings(message.guild.id, member.id);
    await sendModLog(client, message.guild, { action: 'ClearWarns', moderator: message.author, target: member.user, reason: `${count} warn(s) supprimé(s)` });
    return message.reply({ embeds: [success(`${count} avertissement(s) supprimé(s) pour **${member.user.tag}**.`)] });
  },
};
