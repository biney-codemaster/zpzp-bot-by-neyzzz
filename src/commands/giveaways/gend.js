const { endGiveaway } = require('../../services/giveaways');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'gend',
  description: 'End a giveaway now',
  category: 'giveaways',
  usage: '[message_id]',
  permLevel: 'owner',
  async execute(client, message, args) {
    const id = args[0] || message.reference?.messageId;
    if (!id) {
      return message.reply({
        embeds: [error('Provide the giveaway message ID or reply to the giveaway.')],
      });
    }

    const g = client.db.getGiveaway(id);
    if (!g || g.guild_id !== message.guild.id) {
      return message.reply({ embeds: [error('Giveaway not found in this server.')] });
    }
    if (g.ended || g.cancelled) {
      return message.reply({ embeds: [error('Giveaway already ended or cancelled.')] });
    }

    const result = await endGiveaway(client, id);
    if (!result) {
      return message.reply({ embeds: [error('Could not end that giveaway.')] });
    }

    return message.reply({ embeds: [success('Giveaway ended.')] });
  },
};
