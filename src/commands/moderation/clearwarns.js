const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'clearwarns',
  description: 'Clear all warnings',
  category: 'moderation',
  usage: '<member>',
  permLevel: 'admin',
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    if (!member) return message.reply({ embeds: [error('Invalid member.')] });
    if (!canModerate(message.member, member)) {
      return message.reply({ embeds: [error('You cannot moderate this member.')] });
    }
    const count = client.db.clearWarnings(message.guild.id, member.id);
    const caseId = await sendModLog(client, message.guild, {
      action: 'ClearWarns',
      moderator: message.author,
      target: member.user,
      reason: `${count} warning(s) cleared`,
    });
    return message.reply({
      embeds: [
        success(
          `Cleared ${count} warning(s) for **${member.user.tag}**. Case #${caseId}`
        ),
      ],
    });
  },
};
