const { EmbedBuilder, version } = require('discord.js');
const { color } = require('../../utils/embeds');
const { formatDuration } = require('../../utils/helpers');
module.exports = {
  name: 'botinfo', description: 'Show bot info', category: 'utility', aliases: ['bi', 'stats'], permLevel: 'user',
  async execute(client, message) {
    return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setAuthor({ name: client.user.tag, iconURL: client.user.displayAvatarURL() }).setThumbnail(client.user.displayAvatarURL({ size: 256 })).addFields(
      { name: 'Guilds', value: `${client.guilds.cache.size}`, inline: true },
      { name: 'Commands', value: `${client.commands.size}`, inline: true },
      { name: 'Uptime', value: formatDuration(client.uptime || 0), inline: true },
      { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
      { name: 'Memory', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`, inline: true },
      { name: 'Node', value: process.version, inline: true },
      { name: 'discord.js', value: `v${version}`, inline: true }
    ).setTimestamp()] });
  },
};
