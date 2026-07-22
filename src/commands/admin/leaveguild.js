const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'leaveguild',
  description: 'Make the bot leave a server',
  category: 'admin',
  aliases: ['leaveserver', 'guildleave'],
  usage: '<guildId>',
  permLevel: 'owner',
  ownerOnly: true,
  async execute(client, message, args) {
    const guildId = (args[0] || '').trim();
    if (!/^\d{15,20}$/.test(guildId)) {
      return message.reply({
        embeds: [error('Usage: `+leaveguild <guildId>`')],
      });
    }

    const guild =
      client.guilds.cache.get(guildId) ||
      (await client.guilds.fetch(guildId).catch(() => null));

    if (!guild) {
      return message.reply({ embeds: [error('Guild not found / bot is not in it.')] });
    }

    const name = guild.name;
    await guild.leave();
    return message.reply({
      embeds: [success(`Left **${name}** (\`${guildId}\`).`)],
    });
  },
};
