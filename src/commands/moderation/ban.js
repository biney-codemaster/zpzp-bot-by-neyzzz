const { PermissionFlagsBits } = require('discord.js');
const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'ban',
  description: 'Bannit un membre',
  category: 'moderation',
  aliases: ['bannir'],
  usage: '<membre> [raison]',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.BanMembers],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const reason = args.slice(1).join(' ') || 'Aucune raison';

    if (!member && args[0]) {
      const id = args[0].replace(/\D/g, '');
      try {
        await message.guild.members.ban(id, { reason: `${message.author.tag}: ${reason}` });
        const caseId = await sendModLog(client, message.guild, { action: 'Ban', moderator: message.author, target: id, reason });
        return message.reply({ embeds: [success(`\`${id}\` banni. Case #${caseId}\n**Raison :** ${reason}`)] });
      } catch {
        return message.reply({ embeds: [error('Impossible de bannir cet utilisateur.')] });
      }
    }

    if (!member) return message.reply({ embeds: [error('Mentionne un membre ou donne un ID.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('Tu ne peux pas modérer ce membre.')] });
    if (!member.bannable) return message.reply({ embeds: [error('Je ne peux pas bannir ce membre.')] });

    await member.ban({ reason: `${message.author.tag}: ${reason}` });
    const caseId = await sendModLog(client, message.guild, { action: 'Ban', moderator: message.author, target: member.user, reason });
    return message.reply({ embeds: [success(`**${member.user.tag}** banni. Case #${caseId}\n**Raison :** ${reason}`)] });
  },
};
