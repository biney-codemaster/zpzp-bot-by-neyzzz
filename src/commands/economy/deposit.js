const { formatNumber } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const config = require('../../../config');

module.exports = {
  name: 'deposit',
  description: 'Dépose de l\'argent en banque',
  category: 'economy',
  aliases: ['dep', 'bank'],
  usage: '<montant|all>',
  async execute(client, message, args) {
    const eco = client.db.ensureEconomy(message.guild.id, message.author.id);
    let amount = args[0] === 'all' ? eco.wallet : Math.floor(Number(args[0]));
    if (!amount || amount < 1) return message.reply({ embeds: [error('Montant invalide.')] });
    if (eco.wallet < amount) return message.reply({ embeds: [error('Solde portefeuille insuffisant.')] });
    client.db.updateEconomy(message.guild.id, message.author.id, { wallet: eco.wallet - amount, bank: eco.bank + amount });
    return message.reply({ embeds: [success(`Tu as déposé **${formatNumber(amount)}** ${config.economy.currency} en banque.`)] });
  },
};
