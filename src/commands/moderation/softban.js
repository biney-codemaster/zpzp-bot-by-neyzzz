const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'softban',
  description: 'Ban + unban pour supprimer les messages récents',
  category: 'moderation',
  usage: '<membre> [raison]',
  permissions: ['BanMembers'],
  botPermissions: ['BanMembers'],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const reason = args.slice(1).join(' ') || 'Softban';
    if (!member) return message.reply({ embeds: [error('Mentionne un membre valide.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('Tu ne peux pas modérer ce membre.')] });
    if (!member.bannable) return message.reply({ embeds: [error('Je ne peux pas softban ce membre.')] });
    const user = member.user;
    await member.ban({ reason: `Softban by ${message.author.tag}: ${reason}`, deleteMessageSeconds: 60 * 60 * 24 * 7 });
    await message.guild.members.unban(user.id, 'Softban unban');
    await sendModLog(client, message.guild, { action: 'Softban', moderator: message.author, target: user, reason });
    return message.reply({ embeds: [success(`**${user.tag}** a été softban (messages des 7 derniers jours supprimés).`)] });
  },
};
