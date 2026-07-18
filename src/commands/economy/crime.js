const { randomInt, formatNumber, formatDuration, pick } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const config = require('../../../config');

module.exports = {
  name: 'crime',
  description: 'Tente un crime risqué',
  category: 'economy',
  cooldown: 5,
  async execute(client, message) {
    const eco = client.db.ensureEconomy(message.guild.id, message.author.id);
    const cooldown = 2 * 60 * 60 * 1000;
    const left = eco.last_crime + cooldown - Date.now();
    if (left > 0) return message.reply({ embeds: [error(`La police te surveille encore **${formatDuration(left)}**.`)] });
    const win = Math.random() > 0.45;
    if (win) {
      const amount = randomInt(config.economy.crimeMin, config.economy.crimeMax);
      client.db.updateEconomy(message.guild.id, message.author.id, { wallet: eco.wallet + amount, last_crime: Date.now() });
      return message.reply({ embeds: [success(`Tu as réussi ton coup (${pick(['braquage', 'arnaque NFT', 'hack', 'vol de cookies'])}) et gagné **${formatNumber(amount)}** ${config.economy.currency}.`)] });
    }
    const fine = Math.min(eco.wallet, config.economy.crimeFailFine);
    client.db.updateEconomy(message.guild.id, message.author.id, { wallet: eco.wallet - fine, last_crime: Date.now() });
    return message.reply({ embeds: [error(`Tu t\'es fait choper... Amende de **${formatNumber(fine)}** ${config.economy.currency}.`)] });
  },
};
