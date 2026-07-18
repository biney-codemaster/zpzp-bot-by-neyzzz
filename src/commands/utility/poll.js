const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'poll',
  description: 'Crée un sondage simple oui/non ou avec options',
  category: 'utility',
  aliases: ['sondage'],
  usage: '<question> | option1 | option2 ...',
  permissions: ['ManageMessages'],
  async execute(client, message, args) {
    const raw = args.join(' ');
    if (!raw) return message.reply({ embeds: [error('Usage : `+poll Question | Oui | Non`')] });
    const parts = raw.split('|').map((p) => p.trim()).filter(Boolean);
    const question = parts.shift();
    await message.delete().catch(() => null);

    if (!parts.length) {
      const embed = new EmbedBuilder().setColor(color()).setTitle('📊 Sondage').setDescription(question).setFooter({ text: `Par ${message.author.tag}` });
      const msg = await message.channel.send({ embeds: [embed] });
      await msg.react('👍');
      await msg.react('👎');
      return;
    }

    if (parts.length > 10) return message.reply({ embeds: [error('Maximum 10 options.')] });
    const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
    const desc = parts.map((p, i) => `${emojis[i]} ${p}`).join('\n');
    const embed = new EmbedBuilder().setColor(color()).setTitle('📊 Sondage').setDescription(`**${question}**\n\n${desc}`).setFooter({ text: `Par ${message.author.tag}` });
    const msg = await message.channel.send({ embeds: [embed] });
    for (let i = 0; i < parts.length; i++) await msg.react(emojis[i]);
  },
};
