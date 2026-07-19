const { pick } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');
const answers = ['Yes.', 'No.', 'Maybe.', 'Without a doubt.', 'Very likely.', 'Ask again later.', 'Signs point to yes.', 'Absolutely not.', 'Concentrate and ask again.', 'Clearly yes.'];
module.exports = {
  name: '8ball', description: 'Ask the magic 8-ball', category: 'fun', aliases: ['eightball'], usage: '<question>', permLevel: 'user',
  async execute(client, message, args) {
    if (!args.length) return message.reply({ embeds: [error('Ask a question.')] });
    return message.reply({ embeds: [info(`Question: *${args.join(' ')}*\nAnswer: **${pick(answers)}**`)] });
  },
};
