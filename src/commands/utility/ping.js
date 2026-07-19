const { info } = require('../../utils/embeds');
module.exports = {
  name: 'ping', description: 'Bot latency', category: 'utility', permLevel: 'user',
  async execute(client, message) {
    const sent = await message.reply({ embeds: [info('Calculating...')] });
    const api = sent.createdTimestamp - message.createdTimestamp;
    return sent.edit({ embeds: [info(`API \`${api}ms\` • WS \`${client.ws.ping}ms\``, 'Pong')] });
  },
};
