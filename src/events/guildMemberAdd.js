const { EmbedBuilder } = require('discord.js');
const { color } = require('../utils/embeds');
const { replacePlaceholders } = require('../utils/helpers');

module.exports = {
  name: 'guildMemberAdd',
  async execute(client, member) {
    const g = client.db.ensureGuild(member.guild.id);

    if (g.autorole) {
      const role = member.guild.roles.cache.get(g.autorole);
      if (role) await member.roles.add(role, 'Autorole').catch(() => null);
    }

    if (!g.welcome_channel) return;
    const channel = member.guild.channels.cache.get(g.welcome_channel);
    if (!channel) return;

    const text = replacePlaceholders(g.welcome_message, {
      user: member.user,
      guild: member.guild,
      memberCount: member.guild.memberCount,
    });

    await channel
      .send({
        content: `${member}`,
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle('Bienvenue')
            .setDescription(text)
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: `${member.guild.memberCount} membres` })
            .setTimestamp(),
        ],
      })
      .catch(() => null);
  },
};
