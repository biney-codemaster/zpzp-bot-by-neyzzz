const { pick } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');
const { RATE_COMMENTS } = require('../../utils/funContent');
const { rateScore } = require('../../services/funGames');

module.exports = {
  name: 'rate',
  description: 'Rate something out of 100',
  category: 'fun',
  usage: '<thing>',
  permLevel: 'user',
  async execute(client, message, args) {
    const thing = args.join(' ').trim();
    if (!thing) {
      return message.reply({ embeds: [error('Usage: `+rate pizza`')] });
    }

    const score = rateScore();
    const comment = pick(RATE_COMMENTS);
    const bar =
      '`' +
      '█'.repeat(Math.round(score / 10)) +
      '░'.repeat(10 - Math.round(score / 10)) +
      '`';

    return message.reply({
      embeds: [
        info(
          [
            `I rate **${thing.slice(0, 200)}** a solid **${score}/100**.`,
            bar,
            comment,
          ].join('\n'),
          'Rate-o-meter'
        ),
      ],
    });
  },
};
