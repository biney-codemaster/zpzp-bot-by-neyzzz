const { fetchMember, canModerate } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'kick',
  description: 'Expulse un membre du serveur',
  category: 'moderation',
  aliases: ['expulser'],
  usage: '<membre> [raison]',
  permissions: ['KickMembers'],
  botPermissions: ['KickMembers'],
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const reason = args.slice(1).join(' ') || 'Aucune raison';
    if (!member) return message.reply({ embeds: [error('Mentionne un membre valide.')] });
    if (!canModerate(message.member, member)) return message.reply({ embeds: [error('Tu ne peux pas modérer ce membre.')] });
    if (!member.kickable) return message.reply({ embeds: [error('Je ne peux pas expulser ce membre.')] });
    await member.kick(`${message.author.tag}: ${reason}`);
    await sendModLog(client, message.guild, { action: 'Kick', moderator: message.author, target: member.user, reason });
    return message.reply({ embeds: [success(`**${member.user.tag}** a été expulsé.\n**Raison :** ${reason}`)] });
  },
};
