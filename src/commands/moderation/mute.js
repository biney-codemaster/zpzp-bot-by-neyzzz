const { PermissionFlagsBits } = require('discord.js');
const { fetchMember, canModerate, parseDuration, formatDuration } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'mute',
  description: 'Timeout a member',
  category: 'moderation',
  aliases: ['timeout', 'tempmute'],
  usage: '<member> <duration> [reason]',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.ModerateMembers],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const duration = parseDuration(args[1]);
    const reason = args.slice(2).join(' ') || 'No reason provided';
    if (!member) return message.reply({ embeds: [error('Invalid member.')] });
    if (!duration) return message.reply({ embeds: [error('Invalid duration (e.g. `10m`, `1h`).')] });
    if (duration > 28 * 24 * 60 * 60 * 1000) return message.reply({ embeds: [error('Max 28 days.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('You cannot moderate this member.')] });
    if (!member.moderatable) return message.reply({ embeds: [error('I cannot mute this member.')] });
    await member.timeout(duration, `${message.author.tag}: ${reason}`);
    const caseId = await sendModLog(client, message.guild, { action: 'Mute', moderator: message.author, target: member.user, reason, extra: formatDuration(duration) });
    return message.reply({ embeds: [success(`**${member.user.tag}** muted for **${formatDuration(duration)}**. Case #${caseId}\n**Reason:** ${reason}`)] });
  },
};
