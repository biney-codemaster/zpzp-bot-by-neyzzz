const { pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');

const jokes = [
  'Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tombent dans le bateau.',
  'Qu\'est-ce qu\'un crocodile qui survole une banque ? Un cash odile.',
  'Que dit une imprimante dans une église ? Ave Maria.',
  'Pourquoi les poissons n\'aiment pas Discord ? Trop de serveurs.',
  'Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ? Un chat-peint de Noël.',
  'J\'ai une blague sur les ascenseurs… mais elle ne fonctionne pas bien entre les étages.',
  'Pourquoi les développeurs confondent Halloween et Noël ? Parce que Oct 31 = Dec 25.',
  'Un atom dit à un autre : "Je crois que j\'ai perdu un électron !" — "T\'es sûr ?" — "Oui, j\'en suis positif."',
];

module.exports = {
  name: 'joke',
  description: 'Raconte une blague',
  category: 'fun',
  aliases: ['blague'],
  async execute(client, message) {
    return message.reply({ embeds: [info(pick(jokes), '😂 Blague')] });
  },
};
