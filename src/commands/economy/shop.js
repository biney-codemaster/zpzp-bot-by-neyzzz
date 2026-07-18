const { EmbedBuilder } = require('discord.js');
const { color } = require('../../utils/embeds');
const { formatNumber } = require('../../utils/helpers');
const config = require('../../../config');

module.exports = {
  name: 'shop',
  description: 'Affiche la boutique',
  category: 'economy',
  aliases: ['boutique', 'store'],
  async execute(client, message) {
    const lines = config.shop.map((i) => `**${i.name}** (\`${i.id}\`) — ${formatNumber(i.price)} ${config.economy.currency}\n*${i.description}*`).join('\n\n');
    const embed = new EmbedBuilder().setColor(color()).setTitle('🛒 Boutique').setDescription(lines).setFooter({ text: 'Achète avec +buy <id>' });
    return message.reply({ embeds: [embed] });
  },
};
