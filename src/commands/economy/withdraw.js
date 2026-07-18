const { formatNumber } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const config = require('../../../config');

module.exports = {
  name: 'withdraw',
  description: 'Retire de l\'argent de la banque',
  category: 'economy',
  aliases: ['with', 'retirer'],
  usage: '<montant|all>',
  async execute(client, message, args) {
    const eco = client.db.ensureEconomy(message.guild.id, message.author.id);
    let amount = args[0] === 'all' ? eco.bank : Math.floor(Number(args[0]));
    if (!amount || amount < 1) return message.reply({ embeds: [error('Montant invalide.')] });
    if (eco.bank < amount) return message.reply({ embeds: [error('Solde banque insuffisant.')] });
    client.db.updateEconomy(message.guild.id, message.author.id, { wallet: eco.wallet + amount, bank: eco.bank - amount });
    return message.reply({ embeds: [success(`Tu as retiré **${formatNumber(amount)}** ${config.economy.currency}.`)] });
  },
};
