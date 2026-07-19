const { info } = require('../../utils/embeds');

module.exports = {
  name: 'ping',
  description: 'Latence du bot',
  category: 'utility',
  permLevel: 'user',
  async execute(client, message) {
    const sent = await message.reply({ embeds: [info('Calcul…')] });
    const api = sent.createdTimestamp - message.createdTimestamp;
    return sent.edit({
      embeds: [info(`API \`${api}ms\` • WS \`${client.ws.ping}ms\``, 'Pong')],
    });
  },
};
