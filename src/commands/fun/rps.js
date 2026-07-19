const { pick } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');
module.exports = {
  name: 'rps', description: 'Pierre feuille ciseaux', category: 'fun', aliases: ['pfc'], usage: '<pierre|feuille|ciseaux>', permLevel: 'user',
  async execute(client, message, args) {
    const map = { pierre: 'pierre', p: 'pierre', feuille: 'feuille', f: 'feuille', ciseaux: 'ciseaux', c: 'ciseaux' };
    const user = map[(args[0] || '').toLowerCase()];
    if (!user) return message.reply({ embeds: [error('Choisis pierre, feuille ou ciseaux.')] });
    const bot = pick(['pierre', 'feuille', 'ciseaux']);
    let result = 'Égalité.';
    if ((user === 'pierre' && bot === 'ciseaux') || (user === 'feuille' && bot === 'pierre') || (user === 'ciseaux' && bot === 'feuille')) result = 'Tu gagnes.';
    else if (user !== bot) result = 'Tu perds.';
    return message.reply({ embeds: [info(`Toi : **${user}**\nMoi : **${bot}**\n\n${result}`)] });
  },
};
