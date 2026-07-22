const { EmbedBuilder } = require('discord.js');
const { color } = require('../../utils/embeds');

module.exports = {
  name: 'membercount',
  description: 'Show member counts',
  category: 'utility',
  aliases: ['members', 'mc'],
  permLevel: 'user',
  async execute(client, message) {
    const g = message.guild;
    await g.members.fetch().catch(() => null);

    const total = g.memberCount;
    const cached = g.members.cache;
    const humans = cached.filter((m) => !m.user.bot).size;
    const bots = cached.filter((m) => m.user.bot).size;
    const online = cached.filter(
      (m) => m.presence?.status && m.presence.status !== 'offline'
    ).size;

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(`Members — ${g.name}`)
          .addFields(
            { name: 'Total', value: `${total}`, inline: true },
            { name: 'Humans', value: `${humans}`, inline: true },
            { name: 'Bots', value: `${bots}`, inline: true },
            {
              name: 'Online (cached)',
              value: `${online}`,
              inline: true,
            }
          )
          .setFooter({
            text: 'Online count needs Presence Intent enabled',
          })
          .setTimestamp(),
      ],
    });
  },
};
