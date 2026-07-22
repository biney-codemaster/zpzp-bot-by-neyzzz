const { success } = require('../../utils/embeds');

module.exports = {
  name: 'restart',
  description: 'Restart the bot process (host must auto-restart)',
  category: 'admin',
  aliases: ['reboot'],
  permLevel: 'owner',
  ownerOnly: true,
  async execute(client, message) {
    await message.reply({
      embeds: [
        success(
          'Restarting... If the host auto-restarts crashed processes (e.g. Pterodactyl), the bot will come back shortly.'
        ),
      ],
    }).catch(() => null);

    console.log(`[restart] Requested by ${message.author.tag} (${message.author.id})`);
    setTimeout(() => {
      client.destroy();
      // Non-zero exit helps some hosts treat this as a crash/restart.
      process.exit(1);
    }, 500);
  },
};
