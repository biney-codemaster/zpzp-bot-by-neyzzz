const { PermissionFlagsBits } = require('discord.js');
const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'unban',
  description: 'Unban a user',
  category: 'moderation',
  usage: '<id> [reason]',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.BanMembers],
  async execute(client, message, args) {
    const id = (args[0] || '').replace(/\D/g, '');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!id) return message.reply({ embeds: [error('Provide a user ID.')] });
    try {
      await message.guild.members.unban(id, `${message.author.tag}: ${reason}`);
      const caseId = await sendModLog(client, message.guild, { action: 'Unban', moderator: message.author, target: id, reason });
      return message.reply({ embeds: [success(`\`${id}\` unbanned. Case #${caseId}`)] });
    } catch {
      return message.reply({ embeds: [error('Could not unban that user.')] });
    }
  },
};
