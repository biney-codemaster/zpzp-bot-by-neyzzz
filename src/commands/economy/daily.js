const { randomInt, formatNumber, formatDuration } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const config = require('../../../config');

module.exports = {
  name: 'daily',
  description: 'Récupère ta récompense quotidienne',
  category: 'economy',
  aliases: ['quotidien'],
  cooldown: 5,
  async execute(client, message) {
    const eco = client.db.ensureEconomy(message.guild.id, message.author.id);
    const cooldown = 24 * 60 * 60 * 1000;
    const left = eco.last_daily + cooldown - Date.now();
    if (left > 0) return message.reply({ embeds: [error(`Reviens dans **${formatDuration(left)}**.`)] });
    const amount = randomInt(config.economy.dailyMin, config.economy.dailyMax);
    client.db.updateEconomy(message.guild.id, message.author.id, { wallet: eco.wallet + amount, last_daily: Date.now() });
    return message.reply({ embeds: [success(`Tu as reçu **${formatNumber(amount)}** ${config.economy.currency} !`)] });
  },
};
