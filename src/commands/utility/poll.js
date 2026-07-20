const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');
const {
  buildPollEmbed,
  buildPollComponents,
} = require('../../services/polls');

module.exports = {
  name: 'poll',
  description: 'Create a button poll',
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
    if (!question) {
      return message.reply({ embeds: [error('Provide a question.')] });
    }

    let options = parts;
    if (!options.length) options = ['Yes', 'No'];
    if (options.length < 2) {
      return message.reply({ embeds: [error('Need at least 2 options.')] });
    }
    if (options.length > 10) {
      return message.reply({ embeds: [error('Max 10 options.')] });
    }

    await message.delete().catch(() => null);

    const pollData = {
      question,
      options,
      votes: {},
      ended: 0,
      created_at: Date.now(),
    };

    const msg = await message.channel.send({
      embeds: [buildPollEmbed(pollData, message.author.tag)],
      components: [],
    });

    client.db.createPoll({
      messageId: msg.id,
      channelId: message.channel.id,
      guildId: message.guild.id,
      authorId: message.author.id,
      question,
      options,
    });

    await msg.edit({
      components: buildPollComponents(msg.id, options, false),
    });
  },
};
