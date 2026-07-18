const { EmbedBuilder } = require('discord.js');
const { color } = require('../../utils/embeds');
const { formatNumber } = require('../../utils/helpers');
const config = require('../../../config');

module.exports = {
  name: 'leaderboard',
  description: 'Classement économie du serveur',
  category: 'economy',
  aliases: ['lb', 'top', 'baltop'],
  async execute(client, message) {
    const rows = client.db.getTopEconomy(message.guild.id, 10);
    if (!rows.length) return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setDescription('Aucune donnée.')] });
    const lines = await Promise.all(rows.map(async (r, i) => {
      const user = await client.users.fetch(r.user_id).catch(() => null);
      return `**${i + 1}.** ${user ? user.username : r.user_id} — ${formatNumber(r.total)} ${config.economy.currency}`;
    }));
    return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle('🏆 Classement économique').setDescription(lines.join('\n'))] });
  },
};
