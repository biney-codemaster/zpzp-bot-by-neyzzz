const { success } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'lock',
  description: 'Verrouille le salon actuel',
  category: 'moderation',
  aliases: ['lockdown'],
  usage: '[raison]',
  permissions: ['ManageChannels'],
  botPermissions: ['ManageChannels'],
  async execute(client, message, args) {
    const reason = args.join(' ') || 'Salon verrouillé';
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }, { reason });
    await sendModLog(client, message.guild, { action: 'Lock', moderator: message.author, target: message.channel, reason });
    return message.reply({ embeds: [success(`🔒 Salon verrouillé.\n**Raison :** ${reason}`)] });
  },
};
