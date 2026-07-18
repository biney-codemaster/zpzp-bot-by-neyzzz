const { pick } = require('../../utils/helpers');
const { info, error, success } = require('../../utils/embeds');

module.exports = {
  name: 'rps',
  description: 'Pierre feuille ciseaux',
  category: 'fun',
  aliases: ['pfc', 'shi-fu-mi'],
  usage: '<pierre|feuille|ciseaux>',
  async execute(client, message, args) {
    const map = { pierre: 'pierre', rock: 'pierre', p: 'pierre', feuille: 'feuille', paper: 'feuille', f: 'feuille', ciseaux: 'ciseaux', scissors: 'ciseaux', c: 'ciseaux' };
    const user = map[(args[0] || '').toLowerCase()];
    if (!user) return message.reply({ embeds: [error('Choisis : pierre, feuille ou ciseaux.')] });
    const bot = pick(['pierre', 'feuille', 'ciseaux']);
    let result = 'Égalité !';
    if (user === bot) result = 'Égalité !';
    else if ((user === 'pierre' && bot === 'ciseaux') || (user === 'feuille' && bot === 'pierre') || (user === 'ciseaux' && bot === 'feuille')) result = 'Tu gagnes ! 🎉';
    else result = 'Tu perds... 😈';
    return message.reply({ embeds: [info(`Toi : **${user}**\nMoi : **${bot}**\n\n${result}`, '✊ Pierre Feuille Ciseaux')] });
  },
};
