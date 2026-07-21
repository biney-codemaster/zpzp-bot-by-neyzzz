const { info, error } = require('../../utils/embeds');

module.exports = {
  name: 'oldest',
  description: 'Show the oldest joined members',
  category: 'utility',
  usage: '[count]',
  permLevel: 'user',
  async execute(client, message, args) {
    let count = Number(args[0]) || 10;
    if (count < 1) count = 1;
    if (count > 25) count = 25;

    await message.guild.members.fetch().catch(() => null);
    const members = [...message.guild.members.cache.values()]
      .filter((m) => m.joinedTimestamp)
      .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
      .slice(0, count);

    if (!members.length) {
      return message.reply({ embeds: [error('No members found.')] });
    }

    const list = members
      .map(
        (m, i) =>
          `**${i + 1}.** ${m.user.tag} — <t:${Math.floor(m.joinedTimestamp / 1000)}:R>`
      )
      .join('\n');

    return message.reply({
      embeds: [info(list, `Oldest members (${members.length})`)],
    });
  },
};
