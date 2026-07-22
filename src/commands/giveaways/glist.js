const { info, error } = require('../../utils/embeds');
const { parseEntryMap, entryStats } = require('../../services/giveaways');

module.exports = {
  name: 'glist',
  description: 'List active giveaways',
  category: 'giveaways',
  aliases: ['giveaways', 'gactive'],
  permLevel: 'owner',
  async execute(client, message) {
    const rows = client.db.getActiveGiveawaysByGuild(message.guild.id);
    if (!rows.length) {
      return message.reply({
        embeds: [info('No active giveaways in this server.')],
      });
    }

    const lines = rows.map((g) => {
      const map = parseEntryMap(g.entries);
      const { entries, participants } = entryStats(map);
      return [
        `**${g.prize}**`,
        `ID: \`${g.message_id}\` • Channel: <#${g.channel_id}>`,
        `Winners: **${g.winners}** • Entries: **${entries}** (${participants})`,
        `Ends: <t:${Math.floor(g.ends_at / 1000)}:R>`,
      ].join('\n');
    });

    return message.reply({
      embeds: [info(lines.join('\n\n'), `Active giveaways (${rows.length})`)],
    });
  },
};
