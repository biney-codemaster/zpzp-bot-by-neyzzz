const { formatNumber } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const config = require('../../../config');

module.exports = {
  name: 'buy',
  description: 'Achète un item de la boutique',
  category: 'economy',
  aliases: ['acheter'],
  usage: '<item_id>',
  async execute(client, message, args) {
    const id = (args[0] || '').toLowerCase();
    const item = config.shop.find((i) => i.id === id || i.name.toLowerCase() === id);
    if (!item) return message.reply({ embeds: [error('Item introuvable. Voir `+shop`.')] });
    const eco = client.db.ensureEconomy(message.guild.id, message.author.id);
    if (eco.wallet < item.price) return message.reply({ embeds: [error('Pas assez d\'argent.')] });
    client.db.updateEconomy(message.guild.id, message.author.id, { wallet: eco.wallet - item.price });
    client.db.addItem(message.guild.id, message.author.id, item.id, 1);
    return message.reply({ embeds: [success(`Tu as acheté **${item.name}** pour **${formatNumber(item.price)}** ${config.economy.currency}.`)] });
  },
};
