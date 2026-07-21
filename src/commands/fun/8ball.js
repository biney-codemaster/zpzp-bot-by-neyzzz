const { pick } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');
const { EIGHT_BALL } = require('../../utils/funContent');

module.exports = {
  name: '8ball',
  description: 'Ask the magic 8-ball',
  category: 'fun',
  aliases: ['eightball'],
  usage: '<question>',
  permLevel: 'user',
  async execute(client, message, args) {
    if (!args.length) {
      return message.reply({ embeds: [error('Ask a question.')] });
    }
    return message.reply({
      embeds: [
        info(
          `Question: *${args.join(' ')}*\nAnswer: **${pick(EIGHT_BALL)}**`,
          'Magic 8-Ball'
        ),
      ],
    });
  },
};
