const { EmbedBuilder, ChannelType } = require('discord.js');
const { parseChannel } = require('../../utils/helpers');
const { color } = require('../../utils/embeds');

module.exports = {
  name: 'channelinfo',
  description: 'Show channel info',
  category: 'utility',
  aliases: ['ci'],
  usage: '[channel]',
  permLevel: 'user',
  async execute(client, message, args) {
    const channel = parseChannel(message, args[0]) || message.channel;

    const fields = [
      { name: 'ID', value: channel.id, inline: true },
      {
        name: 'Type',
        value: ChannelType[channel.type] || String(channel.type),
        inline: true,
      },
      {
        name: 'Created',
        value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`,
        inline: true,
      },
      {
        name: 'Position',
        value: `${channel.rawPosition ?? channel.position ?? 'N/A'}`,
        inline: true,
      },
      {
        name: 'NSFW',
        value: channel.nsfw ? 'Yes' : 'No',
        inline: true,
      },
      {
        name: 'Category',
        value: channel.parent ? `${channel.parent.name}` : 'None',
        inline: true,
      },
    ];

    if (channel.topic) {
      fields.push({ name: 'Topic', value: channel.topic.slice(0, 1024) });
    }

    if (typeof channel.rateLimitPerUser === 'number') {
      fields.push({
        name: 'Slowmode',
        value: channel.rateLimitPerUser
          ? `${channel.rateLimitPerUser}s`
          : 'Off',
        inline: true,
      });
    }

    if (channel.bitrate) {
      fields.push({
        name: 'Bitrate',
        value: `${Math.round(channel.bitrate / 1000)} kbps`,
        inline: true,
      });
      fields.push({
        name: 'User limit',
        value: channel.userLimit ? `${channel.userLimit}` : 'None',
        inline: true,
      });
    }

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(channel.name ? `#${channel.name}` : 'Channel')
          .addFields(fields)
          .setTimestamp(),
      ],
    });
  },
};
