const { endGiveaway } = require('../../utils/giveaways');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'gend',
  description: 'End a giveaway now',
  category: 'giveaways',
  usage: '<message_id>',
  permLevel: 'mod',
  async execute(client, message, args) {
    const id = args[0] || message.reference?.messageId;
    if (!id) return message.reply({ embeds: [error('Provide the giveaway message ID.')] });
    const g = client.db.getGiveaway(id);
    if (!g || g.ended) return message.reply({ embeds: [error('Giveaway not found or already ended.')] });
    await endGiveaway(client, id);
    return message.reply({ embeds: [success('Giveaway ended.')] });
  },
};
