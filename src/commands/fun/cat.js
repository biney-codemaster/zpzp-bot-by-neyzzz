const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');
module.exports = {
  name: 'cat', description: 'Random cat image', category: 'fun', permLevel: 'user', cooldown: 5,
  async execute(client, message) {
    try {
      const res = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await res.json();
      if (!data?.[0]?.url) throw new Error('no');
      return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle('Cat').setImage(data[0].url)] });
    } catch { return message.reply({ embeds: [error('Could not fetch a cat.')] }); }
  },
};
