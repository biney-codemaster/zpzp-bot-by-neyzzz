const { EmbedBuilder } = require('discord.js');
const { parseDuration, formatDuration } = require('../../utils/helpers');
const { error, color } = require('../../utils/embeds');

module.exports = {
  name: 'gstart',
  description: 'Lance un giveaway',
  category: 'giveaways',
  aliases: ['giveaway'],
  usage: '<durée> <gagnants> <lot>',
  permissions: ['ManageGuild'],
  async execute(client, message, args) {
    const duration = parseDuration(args[0]);
    const winners = Math.floor(Number(args[1]));
    const prize = args.slice(2).join(' ');
    if (!duration || !winners || winners < 1 || !prize) {
      return message.reply({ embeds: [error('Usage : `+gstart 1h 1 Nitro`')] });
    }

    const endsAt = Date.now() + duration;
    const embed = new EmbedBuilder()
      .setColor(color())
      .setTitle('🎉 GIVEAWAY')
      .setDescription(`**Lot :** ${prize}\n**Gagnants :** ${winners}\n**Fin :** <t:${Math.floor(endsAt / 1000)}:R>\n\nRéagis avec 🎉 pour participer !`)
      .setFooter({ text: `Organisé par ${message.author.tag} • Durée ${formatDuration(duration)}` })
      .setTimestamp(endsAt);

    await message.delete().catch(() => null);
    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react('🎉');
    client.db.createGiveaway({
      message_id: msg.id,
      channel_id: message.channel.id,
      guild_id: message.guild.id,
      host_id: message.author.id,
      prize,
      winners,
      ends_at: endsAt,
      entries: [],
    });
  },
};
