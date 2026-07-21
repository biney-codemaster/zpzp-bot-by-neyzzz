const { error } = require('../../utils/embeds');
const { fetchBlackdickImage, imageEmbed } = require('../../services/funApi');

module.exports = {
  name: 'blackdick',
  description: 'Random NSFW image (admin only)',
  category: 'fun',
  aliases: ['bd'],
  permLevel: 'admin',
  cooldown: 5,
  async execute(client, message) {
    if (!message.channel.nsfw) {
      return message.reply({
        embeds: [
          error('This command can only be used in an **NSFW** channel.'),
        ],
      });
    }

    try {
      const img = await fetchBlackdickImage();
      return message.reply({ embeds: [imageEmbed(img)] });
    } catch (err) {
      console.error('[blackdick]', err);
      return message.reply({
        embeds: [
          error('Could not fetch an image right now. Try again later.'),
        ],
      });
    }
  },
};
