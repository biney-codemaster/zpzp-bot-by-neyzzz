const { pick } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');

const answers = [
  'Oui, clairement.', 'Sans aucun doute.', 'Tu peux compter dessus.', 'Très probable.',
  'Oui.', 'Les signes pointent vers oui.', 'Réessaye plus tard.', 'Je ne peux pas dire maintenant.',
  'Concentre-toi et redemande.', 'Mieux vaut ne pas te le dire.', 'Non.', 'Très peu probable.',
  'Mes sources disent non.', 'Les perspectives ne sont pas bonnes.', 'Absolument pas.'
];

module.exports = {
  name: '8ball',
  description: 'Pose une question à la boule magique',
  category: 'fun',
  aliases: ['boule', '8b'],
  usage: '<question>',
  async execute(client, message, args) {
    if (!args.length) return message.reply({ embeds: [error('Pose une question.')] });
    return message.reply({ embeds: [info(`🎱 Question : *${args.join(' ')}*\nRéponse : **${pick(answers)}**`)] });
  },
};
