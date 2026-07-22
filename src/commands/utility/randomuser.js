const { info, error } = require('../../utils/embeds');
const { pick } = require('../../utils/helpers');

module.exports = {
  name: 'randomuser',
  description: 'Pick a random non-bot member',
  category: 'utility',
  aliases: ['randuser', 'someone'],
  permLevel: 'user',
  cooldown: 5,
  async execute(client, message) {
    await message.guild.members.fetch().catch(() => null);
    const humans = [...message.guild.members.cache.values()].filter(
      (m) => !m.user.bot
    );

    if (!humans.length) {
      return message.reply({ embeds: [error('No human members found.')] });
    }

    const member = pick(humans);
    return message.reply({
      embeds: [
        info(
          `${member} (\`${member.user.tag}\`)\nJoined <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
          'Random member'
        ),
      ],
    });
  },
};
