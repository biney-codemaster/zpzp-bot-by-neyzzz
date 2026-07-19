const { fetchMember, pick } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
const roasts = ['ton Wi-Fi a plus de présence que toi.', "t'as le charisme d'une erreur 404.", 'même le mode avion te trouve distant.', 'ton aura buffer trop fort.'];
module.exports = {
  name: 'roast', description: 'Roast (humour)', category: 'fun', usage: '[membre]', permLevel: 'user',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    return message.reply({ embeds: [info(`${member}, ${pick(roasts)}`)] });
  },
};
