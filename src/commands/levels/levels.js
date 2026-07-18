const { EmbedBuilder } = require('discord.js');
const { color } = require('../../utils/embeds');
const { formatNumber } = require('../../utils/helpers');

module.exports = {
  name: 'levels',
  description: 'Classement des niveaux',
  category: 'levels',
  aliases: ['xptop', 'leveltop'],
  async execute(client, message) {
    const rows = client.db.getTopLevels(message.guild.id, 10);
    if (!rows.length) return message.reply({ content: 'Aucune donnée XP.' });
    const lines = await Promise.all(rows.map(async (r, i) => {
      const user = await client.users.fetch(r.user_id).catch(() => null);
      return `**${i + 1}.** ${user ? user.username : r.user_id} — Niv. **${r.level}** (${formatNumber(r.xp)} XP)`;
    }));
    return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle('📈 Classement XP').setDescription(lines.join('\n'))] });
  },
};
