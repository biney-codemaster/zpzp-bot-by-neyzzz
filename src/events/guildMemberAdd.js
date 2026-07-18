const { EmbedBuilder } = require('discord.js');
const { replacePlaceholders } = require('../utils/helpers');
const { color } = require('../utils/embeds');

module.exports = {
  name: 'guildMemberAdd',
  async execute(client, member) {
    const guildData = client.db.ensureGuild(member.guild.id);

    if (guildData.autorole) {
      const role = member.guild.roles.cache.get(guildData.autorole);
      if (role) await member.roles.add(role).catch(() => null);
    }

    if (!guildData.welcome_channel) return;
    const channel = member.guild.channels.cache.get(guildData.welcome_channel);
    if (!channel) return;

    const text = replacePlaceholders(guildData.welcome_message || 'Bienvenue {user} !', {
      user: member.user,
      guild: member.guild,
      memberCount: member.guild.memberCount,
    });

    const embed = new EmbedBuilder()
      .setColor(color())
      .setTitle('👋 Bienvenue !')
      .setDescription(text)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setFooter({ text: `${member.guild.name} • ${member.guild.memberCount} membres` })
      .setTimestamp();

    await channel.send({ content: `${member}`, embeds: [embed] }).catch(() => null);
  },
};
