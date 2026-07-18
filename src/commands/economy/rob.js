const { fetchMember, randomInt, formatNumber, formatDuration } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const config = require('../../../config');

module.exports = {
  name: 'rob',
  description: 'Vole un membre',
  category: 'economy',
  aliases: ['steal', 'voler'],
  usage: '<membre>',
  cooldown: 5,
  async execute(client, message, args) {
    const member = await fetchMember(message, args[0]);
    if (!member || member.id === message.author.id || member.user.bot) {
      return message.reply({ embeds: [error('Mentionne un membre valide.')] });
    }
    const eco = client.db.ensureEconomy(message.guild.id, message.author.id);
    const target = client.db.ensureEconomy(message.guild.id, member.id);
    const cooldown = 3 * 60 * 60 * 1000;
    const left = eco.last_rob + cooldown - Date.now();
    if (left > 0) return message.reply({ embeds: [error(`Tu dois attendre **${formatDuration(left)}**.`)] });
    if (target.wallet < 50) return message.reply({ embeds: [error('Cette personne est trop pauvre.')] });
    const win = Math.random() > 0.4;
    if (win) {
      const amount = Math.min(target.wallet, randomInt(20, Math.max(21, Math.floor(target.wallet * 0.25))));
      client.db.updateEconomy(message.guild.id, message.author.id, { wallet: eco.wallet + amount, last_rob: Date.now() });
      client.db.updateEconomy(message.guild.id, member.id, { wallet: target.wallet - amount });
      return message.reply({ embeds: [success(`Tu as volé **${formatNumber(amount)}** ${config.economy.currency} à ${member} !`)] });
    }
    const fine = Math.min(eco.wallet, randomInt(30, 120));
    client.db.updateEconomy(message.guild.id, message.author.id, { wallet: eco.wallet - fine, last_rob: Date.now() });
    return message.reply({ embeds: [error(`Échec du vol. Tu perds **${formatNumber(fine)}** ${config.economy.currency}.`)] });
  },
};
