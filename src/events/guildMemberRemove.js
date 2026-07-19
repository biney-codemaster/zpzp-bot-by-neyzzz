const { EmbedBuilder } = require('discord.js');
const { color } = require('../utils/embeds');
const { replacePlaceholders } = require('../utils/helpers');

module.exports = {
  name: 'guildMemberRemove',
  async execute(client, member) {
    const g = client.db.ensureGuild(member.guild.id);
    if (!g.leave_channel) return;

    const channel = member.guild.channels.cache.get(g.leave_channel);
    if (!channel) return;

    const text = replacePlaceholders(g.leave_message, {
      user: member.user,
      guild: member.guild,
      memberCount: member.guild.memberCount,
    });

    await channel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle('Départ')
            .setDescription(text)
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setTimestamp(),
        ],
      })
      .catch(() => null);
  },
};
