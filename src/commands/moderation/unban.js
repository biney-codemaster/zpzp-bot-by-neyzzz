const { PermissionFlagsBits } = require('discord.js');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'unban',
  description: 'Débannit un utilisateur',
  category: 'moderation',
  aliases: ['deban'],
  usage: '<id> [raison]',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.BanMembers],
  async execute(client, message, args) {
    const id = (args[0] || '').replace(/\D/g, '');
    const reason = args.slice(1).join(' ') || 'Aucune raison';
    if (!id) return message.reply({ embeds: [error('Donne un ID.')] });
    try {
      await message.guild.members.unban(id, `${message.author.tag}: ${reason}`);
      const caseId = await sendModLog(client, message.guild, { action: 'Unban', moderator: message.author, target: id, reason });
      return message.reply({ embeds: [success(`\`${id}\` débanni. Case #${caseId}`)] });
    } catch {
      return message.reply({ embeds: [error('Impossible de débannir.')] });
    }
  },
};
