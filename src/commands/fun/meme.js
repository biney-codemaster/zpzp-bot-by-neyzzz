const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'meme',
  description: 'Envoie un meme aléatoire',
  category: 'fun',
  cooldown: 5,
  async execute(client, message) {
    try {
      const res = await fetch('https://meme-api.com/gimme');
      const data = await res.json();
      if (!data?.url) throw new Error('no');
      const embed = new EmbedBuilder().setColor(color()).setTitle(data.title || 'Meme').setURL(data.postLink || null).setImage(data.url).setFooter({ text: `r/${data.subreddit || 'memes'}` });
      return message.reply({ embeds: [embed] });
    } catch {
      return message.reply({ embeds: [error('Impossible de récupérer un meme.')] });
    }
  },
};
