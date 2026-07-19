const { PermissionFlagsBits } = require('discord.js');
const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'unmute',
  description: 'Remove a member timeout',
  category: 'moderation',
  aliases: ['untimeout'],
  usage: '<member> [reason]',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.ModerateMembers],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!member) return message.reply({ embeds: [error('Invalid member.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('You cannot moderate this member.')] });
    if (!member.isCommunicationDisabled()) return message.reply({ embeds: [error('This member is not muted.')] });
    await member.timeout(null, `${message.author.tag}: ${reason}`);
    const caseId = await sendModLog(client, message.guild, { action: 'Unmute', moderator: message.author, target: member.user, reason });
    return message.reply({ embeds: [success(`**${member.user.tag}** unmuted. Case #${caseId}`)] });
  },
};
