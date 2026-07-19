const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');
module.exports = {
  name: 'dog', description: 'Random dog image', category: 'fun', permLevel: 'user', cooldown: 5,
  async execute(client, message) {
    try {
      const res = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await res.json();
      if (!data?.message) throw new Error('no');
      return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle('Dog').setImage(data.message)] });
    } catch { return message.reply({ embeds: [error('Could not fetch a dog.')] }); }
  },
};
