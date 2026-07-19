const { EmbedBuilder, ChannelType } = require('discord.js');
const { color } = require('../../utils/embeds');

module.exports = {
  name: 'serverinfo',
  description: 'Infos du serveur',
  category: 'utility',
  aliases: ['si', 'server'],
  permLevel: 'user',
  async execute(client, message) {
    const g = message.guild;
    const owner = await g.fetchOwner().catch(() => null);
    const embed = new EmbedBuilder()
      .setColor(color())
      .setTitle(g.name)
      .setThumbnail(g.iconURL({ size: 256 }))
      .addFields(
        { name: 'Propriétaire', value: owner ? owner.user.tag : '?', inline: true },
        { name: 'ID', value: g.id, inline: true },
        { name: 'Créé', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Membres', value: `${g.memberCount}`, inline: true },
        { name: 'Rôles', value: `${g.roles.cache.size}`, inline: true },
        { name: 'Salons', value: `${g.channels.cache.filter((c) => c.type === ChannelType.GuildText).size} texte / ${g.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size} vocal`, inline: true }
      )
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  },
};
