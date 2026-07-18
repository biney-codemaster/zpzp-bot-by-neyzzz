const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'cat',
  description: 'Envoie une image de chat',
  category: 'fun',
  aliases: ['chat'],
  cooldown: 5,
  async execute(client, message) {
    try {
      const res = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await res.json();
      const url = data?.[0]?.url;
      if (!url) throw new Error('no url');
      return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle('🐱 Miaou').setImage(url)] });
    } catch {
      return message.reply({ embeds: [error('Impossible de récupérer un chat pour le moment.')] });
    }
  },
};
