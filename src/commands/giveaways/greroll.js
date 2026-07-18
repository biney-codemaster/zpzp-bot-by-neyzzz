const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'greroll',
  description: 'Relance le tirage d\'un giveaway',
  category: 'giveaways',
  usage: '<message_id>',
  permissions: ['ManageGuild'],
  async execute(client, message, args) {
    const id = args[0] || message.reference?.messageId;
    const g = client.db.getGiveaway(id);
    if (!g) return message.reply({ embeds: [error('Giveaway introuvable.')] });
    const entries = [...new Set(g.entries || [])];
    if (!entries.length) return message.reply({ embeds: [error('Aucune participation.')] });
    const winner = entries[Math.floor(Math.random() * entries.length)];
    return message.reply({
      content: `🎉 Nouveau gagnant pour **${g.prize}** : <@${winner}> !`,
      embeds: [success(`Reroll effectué.`)],
    });
  },
};
