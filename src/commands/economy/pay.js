const { fetchMember, formatNumber } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const config = require('../../../config');

module.exports = {
  name: 'pay',
  description: 'Donne de l\'argent à quelqu\'un',
  category: 'economy',
  aliases: ['give', 'donner'],
  usage: '<membre> <montant>',
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    const amount = Math.floor(Number(args[1]));
    if (!member || member.id === message.author.id) return message.reply({ embeds: [error('Mentionne un autre membre.')] });
    if (!amount || amount < 1) return message.reply({ embeds: [error('Montant invalide.')] });
    const eco = client.db.ensureEconomy(message.guild.id, message.author.id);
    if (eco.wallet < amount) return message.reply({ embeds: [error('Solde insuffisant.')] });
    const target = client.db.ensureEconomy(message.guild.id, member.id);
    client.db.updateEconomy(message.guild.id, message.author.id, { wallet: eco.wallet - amount });
    client.db.updateEconomy(message.guild.id, member.id, { wallet: target.wallet + amount });
    return message.reply({ embeds: [success(`Tu as donné **${formatNumber(amount)}** ${config.economy.currency} à ${member}.`)] });
  },
};
