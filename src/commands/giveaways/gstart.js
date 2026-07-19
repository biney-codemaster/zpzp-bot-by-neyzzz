const { EmbedBuilder } = require('discord.js');
const { parseDuration, formatDuration } = require('../../utils/helpers');
const { error, color } = require('../../utils/embeds');

module.exports = {
  name: 'gstart', description: 'Lance un giveaway', category: 'giveaways', aliases: ['giveaway'], usage: '<durée> <gagnants> <lot>', permLevel: 'mod',
  async execute(client, message, args) {
    const duration = parseDuration(args[0]);
    const winners = Math.floor(Number(args[1]));
    const prize = args.slice(2).join(' ');
    if (!duration || !winners || winners < 1 || !prize) return message.reply({ embeds: [error('Usage : `+gstart 1h 1 Nitro`')] });
    const endsAt = Date.now() + duration;
    await message.delete().catch(() => null);
    const msg = await message.channel.send({
      embeds: [new EmbedBuilder().setColor(color()).setTitle('Giveaway').setDescription(
        `**Lot :** ${prize}\n**Gagnants :** ${winners}\n**Fin :** <t:${Math.floor(endsAt / 1000)}:R>\n\nRéagis avec 🎉 pour participer.`
      ).setFooter({ text: `Par ${message.author.tag} • ${formatDuration(duration)}` }).setTimestamp(endsAt)],
    });
    await msg.react('🎉');
    client.db.createGiveaway({
      messageId: msg.id, channelId: message.channel.id, guildId: message.guild.id,
      hostId: message.author.id, prize, winners, endsAt, entries: [],
    });
  },
};
