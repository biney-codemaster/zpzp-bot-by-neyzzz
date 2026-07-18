const { fetchMember, formatNumber } = require('../../utils/helpers');
const { info } = require('../../utils/embeds');
const config = require('../../../config');

module.exports = {
  name: 'balance',
  description: 'Affiche ton solde',
  category: 'economy',
  aliases: ['bal', 'money', 'solde'],
  usage: '[membre]',
  async execute(client, message, args) {
    const member = (await fetchMember(message, args[0])) || message.member;
    const eco = client.db.ensureEconomy(message.guild.id, member.id);
    return message.reply({
      embeds: [info(
        `Portefeuille : **${formatNumber(eco.wallet)}** ${config.economy.currency}\nBanque : **${formatNumber(eco.bank)}** ${config.economy.currency}\nTotal : **${formatNumber(eco.wallet + eco.bank)}** ${config.economy.currency}`,
        `💰 Solde de ${member.user.username}`
      )],
    });
  },
};
