const { EmbedBuilder, ChannelType } = require('discord.js');
const { color } = require('../../utils/embeds');

module.exports = {
  name: 'serverinfo',
  description: 'Affiche les infos du serveur',
  category: 'utility',
  aliases: ['si', 'server', 'guild'],
  async execute(client, message) {
    const { guild } = message;
    const owner = await guild.fetchOwner().catch(() => null);
    const text = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voice = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const embed = new EmbedBuilder()
      .setColor(color())
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Propriétaire', value: owner ? `${owner.user.tag}` : 'Inconnu', inline: true },
        { name: 'ID', value: guild.id, inline: true },
        { name: 'Créé', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Membres', value: `${guild.memberCount}`, inline: true },
        { name: 'Rôles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Salons', value: `${text} texte / ${voice} vocal`, inline: true },
        { name: 'Boosts', value: `Niveau ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0})`, inline: true },
        { name: 'Vérification', value: String(guild.verificationLevel), inline: true }
      )
      .setTimestamp();
    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 512 }));
    return message.reply({ embeds: [embed] });
  },
};
