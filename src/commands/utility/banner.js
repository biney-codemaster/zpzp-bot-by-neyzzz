const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');
module.exports = {
  name: 'banner', description: 'Show user banner', category: 'utility', usage: '[member]', permLevel: 'user',
  async execute(client, message, args) {
    const user = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) || message.author;
    const fetched = await user.fetch();
    const banner = fetched.bannerURL({ size: 1024 });
    if (!banner) return message.reply({ embeds: [error('No banner.')] });
    return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle(user.tag).setImage(banner)] });
  },
};
