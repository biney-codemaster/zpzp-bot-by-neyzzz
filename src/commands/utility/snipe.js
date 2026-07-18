const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'snipe',
  description: 'Affiche le dernier message supprimé du salon',
  category: 'utility',
  aliases: ['s'],
  permissions: ['ManageMessages'],
  async execute(client, message) {
    const data = client.snipes?.get(message.channel.id);
    if (!data) return message.reply({ embeds: [error('Aucun message supprimé récemment.')] });
    const embed = new EmbedBuilder()
      .setColor(color())
      .setAuthor({ name: data.author, iconURL: data.avatar })
      .setDescription(data.content || '*vide*')
      .setFooter({ text: 'Message snipé' })
      .setTimestamp(data.createdAt);
    if (data.image) embed.setImage(data.image);
    return message.reply({ embeds: [embed] });
  },
};
