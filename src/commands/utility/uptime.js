const { info } = require('../../utils/embeds');
const { formatDuration } = require('../../utils/helpers');

module.exports = {
  name: 'uptime',
  description: 'Show bot uptime',
  category: 'utility',
  aliases: ['up'],
  permLevel: 'user',
  async execute(client, message) {
    const started = Math.floor((Date.now() - (client.uptime || 0)) / 1000);
    return message.reply({
      embeds: [
        info(
          [
            `**Uptime:** ${formatDuration(client.uptime || 0)}`,
            `**Started:** <t:${started}:R> (<t:${started}:f>)`,
            `**Ping:** ${client.ws.ping}ms`,
          ].join('\n'),
          'Uptime'
        ),
      ],
    });
  },
};
