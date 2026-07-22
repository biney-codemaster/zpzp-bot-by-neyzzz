const { error } = require('../../utils/embeds');
const { fetchCatImage, imageEmbed } = require('../../services/funApi');

module.exports = {
  name: 'cat',
  description: 'Random cat image',
  category: 'fun',
  permLevel: 'user',
  cooldown: 5,
  async execute(client, message) {
    try {
      const img = await fetchCatImage();
      return message.reply({ embeds: [imageEmbed(img)] });
    } catch (err) {
      console.error('[cat]', err);
      return message.reply({
        embeds: [error('Could not fetch a cat right now. Try again later.')],
      });
    }
  },
};
