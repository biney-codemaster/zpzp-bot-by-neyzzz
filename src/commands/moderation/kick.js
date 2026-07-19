const { PermissionFlagsBits } = require('discord.js');
const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'kick',
  description: 'Kick a member',
  category: 'moderation',
  usage: '<member> [reason]',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.KickMembers],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!member) return message.reply({ embeds: [error('Invalid member.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('You cannot moderate this member.')] });
    if (!member.kickable) return message.reply({ embeds: [error('I cannot kick this member.')] });
    await member.kick(`${message.author.tag}: ${reason}`);
    const caseId = await sendModLog(client, message.guild, { action: 'Kick', moderator: message.author, target: member.user, reason });
    return message.reply({ embeds: [success(`**${member.user.tag}** kicked. Case #${caseId}\n**Reason:** ${reason}`)] });
  },
};
