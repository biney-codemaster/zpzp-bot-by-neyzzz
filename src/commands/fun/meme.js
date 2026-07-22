const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');
const { fetchMeme } = require('../../services/funApi');

module.exports = {
  name: 'meme',
  description: 'Random meme',
  category: 'fun',
  permLevel: 'user',
  cooldown: 5,
  async execute(client, message) {
    try {
      const meme = await fetchMeme();
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle(meme.title || 'Meme')
            .setImage(meme.url)
            .setFooter({ text: meme.footer || 'Meme API' })
            .setTimestamp(),
        ],
      });
    } catch (err) {
      console.error('[meme]', err);
      return message.reply({
        embeds: [error('Could not fetch a meme right now. Try again later.')],
      });
    }
  },
};
