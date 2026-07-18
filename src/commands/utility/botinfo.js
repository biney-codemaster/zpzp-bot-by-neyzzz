const { EmbedBuilder, version } = require('discord.js');
const os = require('os');
const { color } = require('../../utils/embeds');
const { formatDuration, formatNumber } = require('../../utils/helpers');

module.exports = {
  name: 'botinfo',
  description: 'Infos sur le bot',
  category: 'utility',
  aliases: ['bi', 'stats', 'about'],
  async execute(client, message) {
    const embed = new EmbedBuilder()
      .setColor(color())
      .setAuthor({ name: client.user.tag, iconURL: client.user.displayAvatarURL() })
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .setDescription('Bot multifonctions prefix — ZPZP by neyzzz')
      .addFields(
        { name: 'Serveurs', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Utilisateurs', value: formatNumber(client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)), inline: true },
        { name: 'Commandes', value: `${client.commands.size}`, inline: true },
        { name: 'Uptime', value: formatDuration(client.uptime || 0), inline: true },
        { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
        { name: 'Mémoire', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`, inline: true },
        { name: 'Node', value: process.version, inline: true },
        { name: 'discord.js', value: `v${version}`, inline: true },
        { name: 'OS', value: `${os.type()} ${os.arch()}`, inline: true }
      )
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  },
};
