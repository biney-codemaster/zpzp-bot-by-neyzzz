const { PermissionFlagsBits } = require('discord.js');
const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'ban',
  description: 'Ban a member',
  category: 'moderation',
  usage: '<member> [reason]',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.BanMembers],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const reason = args.slice(1).join(' ') || 'No reason provided';

    if (!member && args[0]) {
      const id = args[0].replace(/\D/g, '');
      try {
        await message.guild.members.ban(id, { reason: `${message.author.tag}: ${reason}` });
        const caseId = await sendModLog(client, message.guild, { action: 'Ban', moderator: message.author, target: id, reason });
        return message.reply({ embeds: [success(`\`${id}\` banned. Case #${caseId}\n**Reason:** ${reason}`)] });
      } catch {
        return message.reply({ embeds: [error('Could not ban that user.')] });
      }
    }

    if (!member) return message.reply({ embeds: [error('Mention a member or provide an ID.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('You cannot moderate this member.')] });
    if (!member.bannable) return message.reply({ embeds: [error('I cannot ban this member.')] });

    await member.ban({ reason: `${message.author.tag}: ${reason}` });
    const caseId = await sendModLog(client, message.guild, { action: 'Ban', moderator: message.author, target: member.user, reason });
    return message.reply({ embeds: [success(`**${member.user.tag}** banned. Case #${caseId}\n**Reason:** ${reason}`)] });
  },
};
