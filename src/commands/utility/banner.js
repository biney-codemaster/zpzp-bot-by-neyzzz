const { EmbedBuilder } = require('discord.js');
const { fetchMember } = require('../../utils/helpers');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'banner',
  description: 'Show user banner',
  category: 'utility',
  usage: '[member]',
  permLevel: 'user',
  async execute(client, message, args) {
    const member = args[0]
      ? await fetchMember(message, args[0])
      : message.member;
    const user = member?.user || message.author;
    const fetched = await user.fetch();
    const banner = fetched.bannerURL({ size: 1024 });
    if (!banner) {
      return message.reply({ embeds: [error('No banner.')] });
    }
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(`${user.tag} — Banner`)
          .setImage(banner)
          .setTimestamp(),
      ],
    });
  },
};
