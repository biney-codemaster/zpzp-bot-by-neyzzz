const { EmbedBuilder } = require('discord.js');
const { replacePlaceholders } = require('../utils/helpers');
const { color } = require('../utils/embeds');

module.exports = {
  name: 'guildMemberRemove',
  async execute(client, member) {
    const guildData = client.db.ensureGuild(member.guild.id);
    if (!guildData.leave_channel) return;

    const channel = member.guild.channels.cache.get(guildData.leave_channel);
    if (!channel) return;

    const text = replacePlaceholders(guildData.leave_message || '{user} a quitté le serveur.', {
      user: member.user,
      guild: member.guild,
      memberCount: member.guild.memberCount,
    });

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('👋 Au revoir')
      .setDescription(text)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => null);
  },
};
