const { success } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'unlock',
  description: 'Déverrouille le salon actuel',
  category: 'moderation',
  aliases: ['unlockdown'],
  usage: '[raison]',
  permissions: ['ManageChannels'],
  botPermissions: ['ManageChannels'],
  async execute(client, message, args) {
    const reason = args.join(' ') || 'Salon déverrouillé';
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }, { reason });
    await sendModLog(client, message.guild, { action: 'Unlock', moderator: message.author, target: message.channel, reason });
    return message.reply({ embeds: [success(`🔓 Salon déverrouillé.\n**Raison :** ${reason}`)] });
  },
};
