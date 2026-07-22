const { info, error } = require('../../utils/embeds');

module.exports = {
  name: 'boosters',
  description: 'List server boosters',
  category: 'utility',
  aliases: ['boosts'],
  permLevel: 'user',
  async execute(client, message) {
    await message.guild.members.fetch().catch(() => null);
    const boosters = [...message.guild.members.cache.values()]
      .filter((m) => m.premiumSinceTimestamp)
      .sort((a, b) => a.premiumSinceTimestamp - b.premiumSinceTimestamp);

    const count = message.guild.premiumSubscriptionCount || boosters.length;
    const level = message.guild.premiumTier;

    if (!boosters.length) {
      return message.reply({
        embeds: [
          info(
            `Boost level **${level}** • **${count}** boost(s)\nNo boosters found in cache.`,
            'Boosters'
          ),
        ],
      });
    }

    const list = boosters
      .slice(0, 40)
      .map(
        (m) =>
          `${m} — since <t:${Math.floor(m.premiumSinceTimestamp / 1000)}:R>`
      )
      .join('\n');

    const extra =
      boosters.length > 40 ? `\n…and ${boosters.length - 40} more` : '';

    return message.reply({
      embeds: [
        info(
          `Boost level **${level}** • **${count}** boost(s) • **${boosters.length}** booster(s)\n\n${list}${extra}`,
          `Boosters — ${message.guild.name}`
        ),
      ],
    });
  },
};
