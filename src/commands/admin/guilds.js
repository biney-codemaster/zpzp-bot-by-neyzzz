const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');
const { withEmoji } = require('../../utils/emoji');

module.exports = {
  name: 'guilds',
  description: 'List servers the bot is in',
  category: 'admin',
  aliases: ['servers'],
  usage: '[page]',
  permLevel: 'owner',
  ownerOnly: true,
  async execute(client, message, args) {
    const guilds = [...client.guilds.cache.values()].sort(
      (a, b) => b.memberCount - a.memberCount
    );

    if (!guilds.length) {
      return message.reply({ embeds: [error('Not in any guilds.')] });
    }

    const perPage = 10;
    const pages = Math.max(1, Math.ceil(guilds.length / perPage));
    let page = Number.parseInt(args[0], 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (page > pages) page = pages;

    const slice = guilds.slice((page - 1) * perPage, page * perPage);
    const lines = slice.map(
      (g, i) =>
        `\`${(page - 1) * perPage + i + 1}.\` **${g.name}** — \`${g.id}\` · ${g.memberCount} members`
    );

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(withEmoji('admin', `Guilds (${guilds.length})`))
          .setDescription(lines.join('\n'))
          .setFooter({ text: `Page ${page}/${pages}` })
          .setTimestamp(),
      ],
    });
  },
};
