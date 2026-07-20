const { PermissionFlagsBits } = require('discord.js');
const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');
const { dmSanction } = require('../../services/moderation');

module.exports = {
  name: 'softban',
  description: 'Ban then unban (delete recent messages)',
  category: 'moderation',
  usage: '<member> [reason]',
  permLevel: 'admin',
  botPermissions: [PermissionFlagsBits.BanMembers],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const reason = args.slice(1).join(' ') || 'Softban';
    if (!member) return message.reply({ embeds: [error('Invalid member.')] });
    if (!canModerate(message.member, member)) {
      return message.reply({ embeds: [error('You cannot moderate this member.')] });
    }
    if (!member.bannable) {
      return message.reply({ embeds: [error('I cannot softban this member.')] });
    }

    const user = member.user;
    await member.ban({
      reason: `Softban ${message.author.tag}: ${reason}`,
      deleteMessageSeconds: 60 * 60 * 24 * 7,
    });
    await message.guild.members.unban(user.id, 'Softban unban');
    const caseId = await sendModLog(client, message.guild, {
      action: 'Softban',
      moderator: message.author,
      target: user,
      reason,
    });

    await dmSanction(user, message.guild, {
      action: 'Softban',
      reason,
      caseId,
    });

    return message.reply({
      embeds: [success(`**${user.tag}** softbanned. Case #${caseId}\n**Reason:** ${reason}`)],
    });
  },
};
