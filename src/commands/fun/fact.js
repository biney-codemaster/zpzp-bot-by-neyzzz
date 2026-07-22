const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');
const { fetchFact } = require('../../services/funApi');

module.exports = {
  name: 'fact',
  description: 'Random fun fact',
  category: 'fun',
  aliases: ['funfact'],
  permLevel: 'user',
  cooldown: 5,
  async execute(client, message) {
    try {
      const fact = await fetchFact();
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle('Fun fact')
            .setDescription(fact.text)
            .setFooter({ text: fact.source })
            .setTimestamp(),
        ],
      });
    } catch (err) {
      console.error('[fact]', err);
      return message.reply({
        embeds: [error('Could not fetch a fact right now. Try again later.')],
      });
    }
  },
};
