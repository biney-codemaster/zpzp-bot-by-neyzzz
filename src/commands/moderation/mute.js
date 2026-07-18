const { fetchMember, canModerate, parseDuration, formatDuration } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'mute',
  description: 'Timeout un membre (mute temporaire Discord)',
  category: 'moderation',
  aliases: ['timeout', 'tempmute'],
  usage: '<membre> <durée> [raison]',
  permissions: ['ModerateMembers'],
  botPermissions: ['ModerateMembers'],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const duration = parseDuration(args[1]);
    const reason = args.slice(2).join(' ') || 'Aucune raison';
    if (!member) return message.reply({ embeds: [error('Mentionne un membre valide.')] });
    if (!duration) return message.reply({ embeds: [error('Durée invalide. Exemples : `10m`, `1h`, `1d`')] });
    if (duration > 28 * 24 * 60 * 60 * 1000) return message.reply({ embeds: [error('Le timeout max est de 28 jours.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('Tu ne peux pas modérer ce membre.')] });
    if (!member.moderatable) return message.reply({ embeds: [error('Je ne peux pas mute ce membre.')] });
    await member.timeout(duration, `${message.author.tag}: ${reason}`);
    await sendModLog(client, message.guild, { action: 'Mute', moderator: message.author, target: member.user, reason, extra: formatDuration(duration) });
    return message.reply({ embeds: [success(`**${member.user.tag}** est mute pendant **${formatDuration(duration)}**.\n**Raison :** ${reason}`)] });
  },
};
