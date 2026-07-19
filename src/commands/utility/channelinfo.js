const { EmbedBuilder, ChannelType } = require('discord.js');
const { parseChannel } = require('../../utils/helpers');
const { color } = require('../../utils/embeds');
module.exports = {
  name: 'channelinfo', description: 'Show channel info', category: 'utility', aliases: ['ci'], usage: '[channel]', permLevel: 'user',
  async execute(client, message, args) {
    const channel = parseChannel(message, args[0]) || message.channel;
    return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle(`#${channel.name}`).addFields(
      { name: 'ID', value: channel.id, inline: true },
      { name: 'Type', value: ChannelType[channel.type] || String(channel.type), inline: true },
      { name: 'Created', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Topic', value: channel.topic || 'None' }
    )] });
  },
};
