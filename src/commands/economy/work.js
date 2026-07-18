const { randomInt, formatNumber, formatDuration, pick } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const config = require('../../../config');

const jobs = ['développeur', 'livreur', 'streamer', 'cuisinier', 'garde du corps', 'DJ', 'modérateur Discord', 'fermier'];

module.exports = {
  name: 'work',
  description: 'Travaille pour gagner de l\'argent',
  category: 'economy',
  aliases: ['travail', 'w'],
  cooldown: 5,
  async execute(client, message) {
    const eco = client.db.ensureEconomy(message.guild.id, message.author.id);
    const cooldown = 60 * 60 * 1000;
    const left = eco.last_work + cooldown - Date.now();
    if (left > 0) return message.reply({ embeds: [error(`Tu es fatigué. Reviens dans **${formatDuration(left)}**.`)] });
    const amount = randomInt(config.economy.workMin, config.economy.workMax);
    client.db.updateEconomy(message.guild.id, message.author.id, { wallet: eco.wallet + amount, last_work: Date.now() });
    return message.reply({ embeds: [success(`Tu as travaillé comme **${pick(jobs)}** et gagné **${formatNumber(amount)}** ${config.economy.currency}.`)] });
  },
};
