const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'servericon',
  description: 'Icône du serveur',
  category: 'utility',
  aliases: ['icon'],
  permLevel: 'user',
  async execute(client, message) {
    const icon = message.guild.iconURL({ size: 1024 });
    if (!icon) return message.reply({ embeds: [error('Pas d\'icône.')] });
    return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle(message.guild.name).setImage(icon)] });
  },
};
