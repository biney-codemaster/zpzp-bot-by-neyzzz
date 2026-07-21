const { EmbedBuilder } = require('discord.js');
const { pick } = require('../../utils/helpers');
const { color } = require('../../utils/embeds');
const { WOULD_YOU_RATHER } = require('../../utils/funContent');

module.exports = {
  name: 'wouldyourather',
  description: 'Would you rather question',
  category: 'fun',
  aliases: ['wyr'],
  permLevel: 'user',
  async execute(client, message) {
    const [a, b] = pick(WOULD_YOU_RATHER);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle('Would you rather…')
          .setDescription(
            [`**A.** ${a}`, '', `**B.** ${b}`, '', 'Reply in chat with A or B.'].join(
              '\n'
            )
          )
          .setTimestamp(),
      ],
    });
  },
};
