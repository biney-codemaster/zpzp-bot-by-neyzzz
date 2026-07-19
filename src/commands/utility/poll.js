const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'poll',
  description: 'Create a poll',
  category: 'utility',
  usage: '<question> | option1 | option2',
  permLevel: 'mod',
  async execute(client, message, args) {
    const raw = args.join(' ');
    if (!raw) {
      return message.reply({
        embeds: [error('Usage: `+poll Question | Yes | No`')],
      });
    }

    const parts = raw.split('|').map((p) => p.trim()).filter(Boolean);
    const question = parts.shift();
    await message.delete().catch(() => null);

    if (!parts.length) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle('Poll')
            .setDescription(
              `**${question}**\n\nReply in chat with **yes** or **no**.`
            )
            .setFooter({ text: message.author.tag }),
        ],
      });
    }

    if (parts.length > 10) {
      return message.channel.send({
        embeds: [error('Max 10 options.')],
      });
    }

    const desc = parts.map((p, i) => `**${i + 1}.** ${p}`).join('\n');
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle('Poll')
          .setDescription(
            `**${question}**\n\n${desc}\n\nReply with the option number.`
          )
          .setFooter({ text: message.author.tag }),
      ],
    });
  },
};
