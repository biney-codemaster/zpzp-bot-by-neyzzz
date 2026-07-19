const { pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
const jokes = [
  'Why do programmers prefer dark mode? Because light attracts bugs.',
  'There are only 10 kinds of people: those who understand binary and those who do not.',
  'A SQL query walks into a bar, walks up to two tables and asks: can I join you?',
  'Why do Java developers wear glasses? Because they cannot C#.',
  'I would tell you a UDP joke, but you might not get it.',
];
module.exports = {
  name: 'joke', description: 'Tell a joke', category: 'fun', permLevel: 'user',
  async execute(client, message) {
    return message.reply({ embeds: [info(pick(jokes), 'Joke')] });
  },
};
