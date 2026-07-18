const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'dog',
  description: 'Envoie une image de chien',
  category: 'fun',
  aliases: ['chien'],
  cooldown: 5,
  async execute(client, message) {
    try {
      const res = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await res.json();
      if (!data?.message) throw new Error('no url');
      return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle('🐶 Wouf').setImage(data.message)] });
    } catch {
      return message.reply({ embeds: [error('Impossible de récupérer un chien pour le moment.')] });
    }
  },
};
