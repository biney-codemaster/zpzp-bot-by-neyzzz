const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');
module.exports = {
  name: 'meme', description: 'Random meme', category: 'fun', permLevel: 'user', cooldown: 5,
  async execute(client, message) {
    try {
      const res = await fetch('https://meme-api.com/gimme');
      const data = await res.json();
      if (!data?.url) throw new Error('no');
      return message.reply({ embeds: [new EmbedBuilder().setColor(color()).setTitle(data.title || 'Meme').setImage(data.url).setFooter({ text: `r/${data.subreddit || 'memes'}` })] });
    } catch { return message.reply({ embeds: [error('Could not fetch a meme.')] }); }
  },
};
