const { PermissionFlagsBits } = require('discord.js');
const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'unmute',
  description: "Retire le timeout d'un membre",
  category: 'moderation',
  aliases: ['untimeout'],
  usage: '<membre> [raison]',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.ModerateMembers],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const reason = args.slice(1).join(' ') || 'Aucune raison';
    if (!member) return message.reply({ embeds: [error('Membre invalide.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('Tu ne peux pas modérer ce membre.')] });
    if (!member.isCommunicationDisabled()) return message.reply({ embeds: [error("Ce membre n'est pas mute.")] });
    await member.timeout(null, `${message.author.tag}: ${reason}`);
    const caseId = await sendModLog(client, message.guild, { action: 'Unmute', moderator: message.author, target: member.user, reason });
    return message.reply({ embeds: [success(`**${member.user.tag}** unmute. Case #${caseId}`)] });
  },
};
