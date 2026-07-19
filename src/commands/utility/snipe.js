const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'snipe',
  description: 'Dernier message supprimé',
  category: 'utility',
  permLevel: 'mod',
  async execute(client, message) {
    const data = client.snipes.get(message.channel.id);
    if (!data) return message.reply({ embeds: [error('Rien à sniper.')] });
    const embed = new EmbedBuilder()
      .setColor(color())
      .setAuthor({ name: data.author, iconURL: data.avatar })
      .setDescription(data.content || '*vide*')
      .setTimestamp(data.createdAt);
    if (data.image) embed.setImage(data.image);
    return message.reply({ embeds: [embed] });
  },
};
