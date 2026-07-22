const { error } = require('../../utils/embeds');
const { fetchDogImage, imageEmbed } = require('../../services/funApi');

module.exports = {
  name: 'dog',
  description: 'Random dog image',
  category: 'fun',
  permLevel: 'user',
  cooldown: 5,
  async execute(client, message) {
    try {
      const img = await fetchDogImage();
      return message.reply({ embeds: [imageEmbed(img)] });
    } catch (err) {
      console.error('[dog]', err);
      return message.reply({
        embeds: [error('Could not fetch a dog right now. Try again later.')],
      });
    }
  },
};
