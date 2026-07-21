const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'color',
  description: 'Preview a hex color',
  category: 'utility',
  aliases: ['colour', 'hex'],
  usage: '<#hex|RRGGBB>',
  permLevel: 'user',
  async execute(client, message, args) {
    const raw = (args[0] || '').replace(/^#/, '').toUpperCase();
    if (!/^[0-9A-F]{6}$/.test(raw)) {
      return message.reply({
        embeds: [error('Provide a hex color, e.g. `+color #FF5500` or `+color FF5500`.')],
      });
    }

    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(raw)
          .setTitle(`#${raw}`)
          .setDescription('Embed color preview (sidebar).')
          .addFields(
            { name: 'RGB', value: `\`${r}, ${g}, ${b}\``, inline: true },
            { name: 'Hex', value: `\`#${raw}\``, inline: true },
            {
              name: 'Int',
              value: `\`${parseInt(raw, 16)}\``,
              inline: true,
            }
          )
          .setTimestamp(),
      ],
    });
  },
};
