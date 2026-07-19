const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'poll',
  description: 'Crée un sondage',
  category: 'utility',
  aliases: ['sondage'],
  usage: '<question> | option1 | option2',
  permLevel: 'mod',
  async execute(client, message, args) {
    const raw = args.join(' ');
    if (!raw) return message.reply({ embeds: [error('Usage : `+poll Question | Oui | Non`')] });
    const parts = raw.split('|').map((p) => p.trim()).filter(Boolean);
    const question = parts.shift();
    await message.delete().catch(() => null);
    const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

    if (!parts.length) {
      const msg = await message.channel.send({
        embeds: [new EmbedBuilder().setColor(color()).setTitle('Sondage').setDescription(question).setFooter({ text: message.author.tag })],
      });
      await msg.react('👍');
      await msg.react('👎');
      return;
    }
    if (parts.length > 10) return message.channel.send({ embeds: [error('Max 10 options.')] });
    const desc = parts.map((p, i) => `${emojis[i]} ${p}`).join('\n');
    const msg = await message.channel.send({
      embeds: [new EmbedBuilder().setColor(color()).setTitle('Sondage').setDescription(`**${question}**\n\n${desc}`).setFooter({ text: message.author.tag })],
    });
    for (let i = 0; i < parts.length; i++) await msg.react(emojis[i]);
  },
};
