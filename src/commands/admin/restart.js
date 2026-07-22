const { success } = require('../../utils/embeds');
const { performRestart } = require('../../services/restart');

module.exports = {
  name: 'restart',
  description: 'Restart the bot process and announce when back online',
  category: 'admin',
  aliases: ['reboot'],
  permLevel: 'owner',
  ownerOnly: true,
  async execute(client, message) {
    const reply = await message.reply({
      embeds: [success('Restarting now... I will confirm here when I am back online.')],
    }).catch(() => null);

    console.log(`[restart] Requested by ${message.author.tag} (${message.author.id})`);

    setTimeout(() => {
      performRestart(client, {
        channelId: message.channel.id,
        messageId: reply?.id || null,
        requestedBy: message.author.id,
      }).catch((err) => console.error('[restart]', err));
    }, 400);
  },
};
