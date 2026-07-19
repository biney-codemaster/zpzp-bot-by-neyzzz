const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');
module.exports = {
  name: 'cat', description: 'Image de chat', category: 'fun', aliases: ['chat'], permLevel: 'user', cooldown: 5,
  async execute(client, message) {
    try {
      const res = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await res.json();
      if (!data?.[0]?.url) throw new Error('no');
      return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle('Chat').setImage(data[0].url)] });
    } catch { return message.reply({ embeds: [error('Impossible de récupérer un chat.')] }); }
  },
};
