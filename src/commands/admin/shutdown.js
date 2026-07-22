const { success } = require('../../utils/embeds');

module.exports = {
  name: 'shutdown',
  description: 'Shut down the bot process',
  category: 'admin',
  aliases: ['stop'],
  permLevel: 'owner',
  ownerOnly: true,
  async execute(client, message) {
    await message.reply({
      embeds: [success('Shutting down...')],
    }).catch(() => null);

    console.log(`[shutdown] Requested by ${message.author.tag} (${message.author.id})`);
    setTimeout(() => {
      client.destroy();
      process.exit(0);
    }, 500);
  },
};
