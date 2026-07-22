const { EmbedBuilder, ChannelType } = require('discord.js');
const { color } = require('../../utils/embeds');

module.exports = {
  name: 'serverinfo',
  description: 'Show server info',
  category: 'utility',
  aliases: ['si', 'server'],
  permLevel: 'user',
  async execute(client, message) {
    const g = message.guild;
    const owner = await g.fetchOwner().catch(() => null);

    const text = g.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voice = g.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const cats = g.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;
    const threads = g.channels.cache.filter(
      (c) =>
        c.type === ChannelType.PublicThread || c.type === ChannelType.PrivateThread
    ).size;

    const humans = g.members.cache.filter((m) => !m.user.bot).size;
    const bots = g.members.cache.filter((m) => m.user.bot).size;

    const embed = new EmbedBuilder()
      .setColor(color())
      .setTitle(g.name)
      .setThumbnail(g.iconURL({ size: 256 }))
      .addFields(
        { name: 'Owner', value: owner ? `${owner.user.tag}` : '?', inline: true },
        { name: 'ID', value: g.id, inline: true },
        {
          name: 'Created',
          value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        {
          name: 'Members',
          value: `${g.memberCount} total\n${humans} humans • ${bots} bots (cached)`,
          inline: true,
        },
        {
          name: 'Roles / Emojis',
          value: `${g.roles.cache.size} roles\n${g.emojis.cache.size} emojis`,
          inline: true,
        },
        {
          name: 'Boosts',
          value: `Level ${g.premiumTier}\n${g.premiumSubscriptionCount || 0} boost(s)`,
          inline: true,
        },
        {
          name: 'Channels',
          value: `${text} text • ${voice} voice • ${cats} categories${threads ? ` • ${threads} threads` : ''}`,
          inline: false,
        },
        {
          name: 'Verification',
          value: `${g.verificationLevel}`,
          inline: true,
        },
        {
          name: 'Locale',
          value: g.preferredLocale || 'N/A',
          inline: true,
        },
        {
          name: 'Vanity',
          value: g.vanityURLCode ? `discord.gg/${g.vanityURLCode}` : 'None',
          inline: true,
        }
      )
      .setTimestamp();

    if (g.bannerURL()) embed.setImage(g.bannerURL({ size: 1024 }));
    if (g.description) embed.setDescription(g.description);

    return message.reply({ embeds: [embed] });
  },
};
