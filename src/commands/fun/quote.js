const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');
const { fetchQuote } = require('../../services/funApi');

module.exports = {
  name: 'quote',
  description: 'Random inspirational quote',
  category: 'fun',
  aliases: ['inspire'],
  permLevel: 'user',
  cooldown: 5,
  async execute(client, message) {
    try {
      const quote = await fetchQuote();
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle('Quote')
            .setDescription(`*"${quote.content}"*`)
            .addFields({ name: 'Author', value: quote.author })
            .setFooter({ text: quote.source })
            .setTimestamp(),
        ],
      });
    } catch (err) {
      console.error('[quote]', err);
      return message.reply({
        embeds: [error('Could not fetch a quote right now. Try again later.')],
      });
    }
  },
};
