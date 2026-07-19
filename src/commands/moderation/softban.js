const { PermissionFlagsBits } = require('discord.js');
const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'softban',
  description: 'Ban + unban (supprime les msgs récents)',
  category: 'moderation',
  usage: '<membre> [raison]',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.BanMembers],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const reason = args.slice(1).join(' ') || 'Softban';
    if (!member) return message.reply({ embeds: [error('Membre invalide.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('Tu ne peux pas modérer ce membre.')] });
    if (!member.bannable) return message.reply({ embeds: [error('Je ne peux pas softban ce membre.')] });
    const user = member.user;
    await member.ban({ reason: `Softban ${message.author.tag}: ${reason}`, deleteMessageSeconds: 60 * 60 * 24 * 7 });
    await message.guild.members.unban(user.id, 'Softban unban');
    const caseId = await sendModLog(client, message.guild, { action: 'Softban', moderator: message.author, target: user, reason });
    return message.reply({ embeds: [success(`**${user.tag}** softban. Case #${caseId}`)] });
  },
};
