const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'clearwarns',
  description: 'Supprime tous les warns',
  category: 'moderation',
  usage: '<membre>',
  permLevel: 'mod',
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    if (!member) return message.reply({ embeds: [error('Membre invalide.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('Tu ne peux pas modérer ce membre.')] });
    const count = client.db.clearWarnings(message.guild.id, member.id);
    await sendModLog(client, message.guild, { action: 'ClearWarns', moderator: message.author, target: member.user, reason: `${count} warn(s)` });
    return message.reply({ embeds: [success(`${count} warn(s) supprimé(s) pour **${member.user.tag}**.`)] });
  },
};
