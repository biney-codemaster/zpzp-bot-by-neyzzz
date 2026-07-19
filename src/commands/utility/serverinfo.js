const { EmbedBuilder, ChannelType } = require('discord.js');
const { color } = require('../../utils/embeds');
module.exports = {
  name: 'serverinfo', description: 'Show server info', category: 'utility', aliases: ['si', 'server'], permLevel: 'user',
  async execute(client, message) {
    const g = message.guild;
    const owner = await g.fetchOwner().catch(() => null);
    return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle(g.name).setThumbnail(g.iconURL({ size: 256 })).addFields(
      { name: 'Owner', value: owner ? owner.user.tag : '?', inline: true },
      { name: 'ID', value: g.id, inline: true },
      { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Members', value: `${g.memberCount}`, inline: true },
      { name: 'Roles', value: `${g.roles.cache.size}`, inline: true },
      { name: 'Channels', value: `${g.channels.cache.filter((c) => c.type === ChannelType.GuildText).size} text / ${g.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size} voice`, inline: true }
    ).setTimestamp()] });
  },
};
