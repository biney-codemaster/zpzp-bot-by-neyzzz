const { PermissionFlagsBits } = require('discord.js');
const { fetchMember, canModerate, parseDuration, formatDuration } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'mute',
  description: 'Timeout un membre',
  category: 'moderation',
  aliases: ['timeout', 'tempmute'],
  usage: '<membre> <durée> [raison]',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.ModerateMembers],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const duration = parseDuration(args[1]);
    const reason = args.slice(2).join(' ') || 'Aucune raison';
    if (!member) return message.reply({ embeds: [error('Membre invalide.')] });
    if (!duration) return message.reply({ embeds: [error('Durée invalide (ex: `10m`, `1h`).')] });
    if (duration > 28 * 24 * 60 * 60 * 1000) return message.reply({ embeds: [error('Max 28 jours.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('Tu ne peux pas modérer ce membre.')] });
    if (!member.moderatable) return message.reply({ embeds: [error('Je ne peux pas mute ce membre.')] });
    await member.timeout(duration, `${message.author.tag}: ${reason}`);
    const caseId = await sendModLog(client, message.guild, { action: 'Mute', moderator: message.author, target: member.user, reason, extra: formatDuration(duration) });
    return message.reply({ embeds: [success(`**${member.user.tag}** mute **${formatDuration(duration)}**. Case #${caseId}\n**Raison :** ${reason}`)] });
  },
};
