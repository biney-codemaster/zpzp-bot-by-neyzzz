const { cancelGiveaway } = require('../../services/giveaways');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'gcancel',
  description: 'Cancel a giveaway without drawing winners (ID or reply)',
  category: 'giveaways',
  aliases: ['gabort'],
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

    const ok = await cancelGiveaway(client, id);
    if (!ok) {
      return message.reply({ embeds: [error('Could not cancel that giveaway.')] });
    }

    return message.reply({ embeds: [success('Giveaway cancelled.')] });
  },
};
