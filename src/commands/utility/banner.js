const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'banner',
  description: 'Affiche la bannière d\'un utilisateur',
  category: 'utility',
  usage: '[membre]',
  async execute(client, message, args) {
    const user = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) || message.author;
    const fetched = await user.fetch();
    const banner = fetched.bannerURL({ size: 1024 });
    if (!banner) return message.reply({ embeds: [error('Cet utilisateur n\'a pas de bannière.')] });
    return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle(`Bannière de ${user.tag}`).setImage(banner)] });
  },
};
