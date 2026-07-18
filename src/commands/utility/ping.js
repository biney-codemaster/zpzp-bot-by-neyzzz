const { info } = require('../../utils/embeds');

module.exports = {
  name: 'ping',
  description: 'Affiche la latence du bot',
  category: 'utility',
  aliases: ['latency'],
  async execute(client, message) {
    const sent = await message.reply({ embeds: [info('Calcul...')] });
    const ws = client.ws.ping;
    const roundtrip = sent.createdTimestamp - message.createdTimestamp;
    return sent.edit({ embeds: [info(`🏓 **Pong !**\nLatence API : \`${roundtrip}ms\`\nHeartbeat : \`${ws}ms\``)] });
  },
};
