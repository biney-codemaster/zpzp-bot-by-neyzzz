const { parseDuration, formatDuration } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'slowmode',
  description: 'Définit le mode lent du salon',
  category: 'moderation',
  aliases: ['slow'],
  usage: '<durée|off>',
  permissions: ['ManageChannels'],
  botPermissions: ['ManageChannels'],
  async execute(client, message, args) {
    if (!args[0]) return message.reply({ embeds: [error('Usage : `+slowmode 5s` ou `+slowmode off`')] });
    if (['off', '0', 'disable'].includes(args[0].toLowerCase())) {
      await message.channel.setRateLimitPerUser(0);
      return message.reply({ embeds: [success('Mode lent désactivé.')] });
    }
    const duration = parseDuration(args[0]);
    if (!duration) return message.reply({ embeds: [error('Durée invalide.')] });
    const seconds = Math.min(Math.floor(duration / 1000), 21600);
    await message.channel.setRateLimitPerUser(seconds);
    return message.reply({ embeds: [success(`Mode lent défini sur **${formatDuration(seconds * 1000)}**.`)] });
  },
};
