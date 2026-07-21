const { pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
const { JOKES } = require('../../utils/funContent');

module.exports = {
  name: 'joke',
  description: 'Tell a joke',
  category: 'fun',
  permLevel: 'user',
  async execute(client, message) {
    return message.reply({ embeds: [info(pick(JOKES), 'Joke')] });
  },
};
