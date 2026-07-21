const { EmbedBuilder } = require('discord.js');
const { parseDuration } = require('../../utils/helpers');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'timestamp',
  description: 'Generate Discord timestamps',
  category: 'utility',
  aliases: ['ts', 'time'],
  usage: '<duration|unix|now> [style]',
  permLevel: 'user',
  async execute(client, message, args) {
    const input = args[0];
    if (!input) {
      return message.reply({
        embeds: [
          error(
            [
              'Usage:',
              '`+timestamp 1h` — relative from now',
              '`+timestamp now` — current time',
              '`+timestamp 1710000000` — unix seconds',
            ].join('\n')
          ),
        ],
      });
    }

    let unix;
    if (input.toLowerCase() === 'now') {
      unix = Math.floor(Date.now() / 1000);
    } else if (/^\d{9,13}$/.test(input)) {
      unix = input.length > 10 ? Math.floor(Number(input) / 1000) : Number(input);
    } else {
      const ms = parseDuration(input);
      if (!ms) {
        return message.reply({
          embeds: [error('Invalid duration or unix timestamp.')],
        });
      }
      unix = Math.floor((Date.now() + ms) / 1000);
    }

    const styles = [
      ['t', 'Short time'],
      ['T', 'Long time'],
      ['d', 'Short date'],
      ['D', 'Long date'],
      ['f', 'Short date/time'],
      ['F', 'Long date/time'],
      ['R', 'Relative'],
    ];

    const lines = styles.map(
      ([s, label]) => `**${label}** — \`<t:${unix}:${s}>\` → <t:${unix}:${s}>`
    );

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle('Timestamps')
          .setDescription(lines.join('\n'))
          .addFields({ name: 'Unix', value: `\`${unix}\``, inline: true })
          .setTimestamp(),
      ],
    });
  },
};
