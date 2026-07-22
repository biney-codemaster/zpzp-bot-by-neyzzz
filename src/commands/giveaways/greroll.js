const { rerollGiveaway } = require('../../services/giveaways');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'greroll',
  description: 'Reroll giveaway winner(s) by ID or by replying to the giveaway',
  category: 'giveaways',
  usage: '[message_id] [count]',
  permLevel: 'owner',
  async execute(client, message, args) {
    const id = args[0] || message.reference?.messageId;
    if (!id) {
      return message.reply({
        embeds: [error('Provide the giveaway message ID or reply to the giveaway.')],
      });
    }

    let count = Number(args[1]);
    if (!count || count < 1) count = 1;

    const g = client.db.getGiveaway(id);
    if (!g || g.guild_id !== message.guild.id) {
      return message.reply({ embeds: [error('Giveaway not found in this server.')] });
    }

    const result = await rerollGiveaway(client, id, count);
    if (!result) {
      return message.reply({ embeds: [error('Giveaway not found.')] });
    }
    if (result.error) {
      return message.reply({ embeds: [error(result.error)] });
    }

    return message.reply({
      content: `New winner(s) for **${result.prize}**: ${result.winners.map((w) => `<@${w}>`).join(', ')}`,
      embeds: [success(`Rerolled **${result.winners.length}** winner(s).`)],
    });
  },
};
