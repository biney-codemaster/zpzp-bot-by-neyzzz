const { EmbedBuilder, ChannelType } = require('discord.js');
const { parseChannel } = require('../../utils/helpers');
const { color } = require('../../utils/embeds');

module.exports = {
  name: 'channelinfo',
  description: 'Infos sur un salon',
  category: 'utility',
  aliases: ['ci', 'channel'],
  usage: '[salon]',
  async execute(client, message, args) {
    const channel = parseChannel(message, args[0]) || message.channel;
    const embed = new EmbedBuilder()
      .setColor(color())
      .setTitle(`#${channel.name}`)
      .addFields(
        { name: 'ID', value: channel.id, inline: true },
        { name: 'Type', value: ChannelType[channel.type] || String(channel.type), inline: true },
        { name: 'Créé', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Topic', value: channel.topic || 'Aucun' }
      );
    return message.reply({ embeds: [embed] });
  },
};
