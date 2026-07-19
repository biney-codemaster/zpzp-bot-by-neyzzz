const { pick } = require('../../utils/helpers');
const { info, error } = require('../../utils/embeds');
const answers = ['Oui.', 'Non.', 'Peut-être.', 'Sans aucun doute.', 'Très probable.', 'Réessaye plus tard.', 'Les signes disent oui.', 'Absolument pas.', 'Concentre-toi et redemande.', 'Oui, clairement.'];
module.exports = {
  name: '8ball', description: 'Boule magique', category: 'fun', aliases: ['boule'], usage: '<question>', permLevel: 'user',
  async execute(client, message, args) {
    if (!args.length) return message.reply({ embeds: [error('Pose une question.')] });
    return message.reply({ embeds: [info(`Question : *${args.join(' ')}*\nRéponse : **${pick(answers)}**`)] });
  },
};
