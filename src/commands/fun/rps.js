const { pick } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');
module.exports = {
  name: 'rps', description: 'Rock paper scissors', category: 'fun', usage: '<rock|paper|scissors>', permLevel: 'user',
  async execute(client, message, args) {
    const map = { rock: 'rock', r: 'rock', paper: 'paper', p: 'paper', scissors: 'scissors', s: 'scissors' };
    const user = map[(args[0] || '').toLowerCase()];
    if (!user) return message.reply({ embeds: [error('Choose rock, paper, or scissors.')] });
    const bot = pick(['rock', 'paper', 'scissors']);
    let result = 'Tie.';
    if ((user === 'rock' && bot === 'scissors') || (user === 'paper' && bot === 'rock') || (user === 'scissors' && bot === 'paper')) result = 'You win.';
    else if (user !== bot) result = 'You lose.';
    return message.reply({ embeds: [info(`You: **${user}**\nMe: **${bot}**\n\n${result}`)] });
  },
};
