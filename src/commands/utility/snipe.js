const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');
module.exports = {
  name: 'snipe', description: 'Show last deleted message', category: 'utility', permLevel: 'mod',
  async execute(client, message) {
    const data = client.snipes.get(message.channel.id);
    if (!data) return message.reply({ embeds: [error('Nothing to snipe.')] });
    const embed = new EmbedBuilder().setColor(color()).setAuthor({ name: data.author, iconURL: data.avatar }).setDescription(data.content || '*empty*').setTimestamp(data.createdAt);
    if (data.image) embed.setImage(data.image);
    return message.reply({ embeds: [embed] });
  },
};
