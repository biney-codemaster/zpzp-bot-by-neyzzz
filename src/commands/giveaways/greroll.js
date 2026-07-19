const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'greroll',
  description: 'Reroll a giveaway winner',
  category: 'giveaways',
  usage: '<message_id>',
  permLevel: 'mod',
  async execute(client, message, args) {
    const id = args[0] || message.reference?.messageId;
    const g = client.db.getGiveaway(id);
    if (!g) return message.reply({ embeds: [error('Giveaway not found.')] });
    const entries = [...new Set(g.entries || [])];
    if (!entries.length) return message.reply({ embeds: [error('No entries.')] });
    const winner = entries[Math.floor(Math.random() * entries.length)];
    return message.reply({
      content: `New winner for **${g.prize}**: <@${winner}>`,
      embeds: [success('Reroll done.')],
    });
  },
};
