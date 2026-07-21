const { parseDuration } = require('../../utils/helpers');
const { error } = require('../../utils/embeds');
const {
  buildGiveawayEmbed,
  buildGiveawayComponents,
  getGiveawaySettings,
} = require('../../services/giveaways');

module.exports = {
  name: 'gstart',
  description: 'Start a giveaway',
  category: 'giveaways',
  aliases: ['giveaway'],
  usage: '<duration> <winners> <prize>',
  permLevel: 'admin',
  async execute(client, message, args) {
    const duration = parseDuration(args[0]);
    const winners = Math.floor(Number(args[1]));
    const prize = args.slice(2).join(' ');

    if (!duration || !winners || winners < 1 || !prize) {
      return message.reply({
        embeds: [error('Usage: `+gstart 1h 1 Nitro`')],
      });
    }

    const guildData = client.db.ensureGuild(message.guild.id);
    const settings = getGiveawaySettings(guildData);
    const endsAt = Date.now() + duration;

    await message.delete().catch(() => null);

    const placeholder = {
      prize,
      winners,
      ends_at: endsAt,
      entries: '{}',
      ended: 0,
      cancelled: 0,
      host_id: message.author.id,
      ping_on_end: settings.pingOnEnd ? 1 : 0,
    };

    const msg = await message.channel.send({
      embeds: [
        buildGiveawayEmbed(placeholder, message.guild, guildData, message.author.tag),
      ],
      components: buildGiveawayComponents(),
    });

    client.db.createGiveaway({
      messageId: msg.id,
      channelId: message.channel.id,
      guildId: message.guild.id,
      hostId: message.author.id,
      prize,
      winners,
      endsAt,
      entries: {},
      pingOnEnd: settings.pingOnEnd,
    });
  },
};
