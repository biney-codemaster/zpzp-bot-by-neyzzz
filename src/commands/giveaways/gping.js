const { success, error } = require('../../utils/embeds');

function parseWinners(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

module.exports = {
  name: 'gping',
  description: 'Ping stored winners of an ended giveaway (ID or reply)',
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
    if (!g.ended || g.cancelled) {
      return message.reply({
        embeds: [error('That giveaway must be ended (not cancelled) to ping winners.')],
      });
    }

    const winners = parseWinners(g.winner_ids);
    if (!winners.length) {
      return message.reply({ embeds: [error('No winners stored for that giveaway.')] });
    }

    const channel = await client.channels.fetch(g.channel_id).catch(() => null);
    if (!channel) {
      return message.reply({ embeds: [error('Giveaway channel not found.')] });
    }

    await channel
      .send({
        content: `Winner ping for **${g.prize}**: ${winners.map((w) => `<@${w}>`).join(', ')}`,
        allowedMentions: { users: winners, roles: [], parse: [] },
      })
      .catch(() => null);

    return message.reply({ embeds: [success('Winners pinged.')] });
  },
};
