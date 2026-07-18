const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'unban',
  description: 'Révoque le bannissement d\'un utilisateur',
  category: 'moderation',
  aliases: ['deban'],
  usage: '<id> [raison]',
  permissions: ['BanMembers'],
  botPermissions: ['BanMembers'],
  async execute(client, message, args) {
    const id = (args[0] || '').replace(/\D/g, '');
    const reason = args.slice(1).join(' ') || 'Aucune raison';
    if (!id) return message.reply({ embeds: [error('Donne l\'ID de l\'utilisateur à débannir.')] });
    try {
      await message.guild.members.unban(id, `${message.author.tag}: ${reason}`);
      await sendModLog(client, message.guild, { action: 'Unban', moderator: message.author, target: id, reason });
      return message.reply({ embeds: [success(`L\'utilisateur \`${id}\` a été débanni.`)] });
    } catch {
      return message.reply({ embeds: [error('Impossible de débannir (ID invalide ou pas banni).')] });
    }
  },
};
