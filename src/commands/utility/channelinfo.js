const { EmbedBuilder, ChannelType } = require('discord.js');
const { parseChannel } = require('../../utils/helpers');
const { color } = require('../../utils/embeds');

module.exports = {
  name: 'channelinfo',
  description: "Infos d'un salon",
  category: 'utility',
  aliases: ['ci'],
  usage: '[salon]',
  permLevel: 'user',
  async execute(client, message, args) {
    const channel = parseChannel(message, args[0]) || message.channel;
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(`#${channel.name}`)
          .addFields(
            { name: 'ID', value: channel.id, inline: true },
            { name: 'Type', value: ChannelType[channel.type] || String(channel.type), inline: true },
            { name: 'Créé', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Topic', value: channel.topic || 'Aucun' }
          ),
      ],
    });
  },
};
