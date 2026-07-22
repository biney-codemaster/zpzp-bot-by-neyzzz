const { info } = require('../../utils/embeds');

module.exports = {
  name: 'reminders',
  description: 'List your active reminders',
  category: 'utility',
  aliases: ['myreminders'],
  usage: '',
  permLevel: 'user',
  async execute(client, message) {
    const list = client.db.getUserReminders(message.guild.id, message.author.id);
    if (!list.length) {
      return message.reply({
        embeds: [
          info(
            'You have no active reminders.\nSet one with `+remind 10m text`.'
          ),
        ],
      });
    }

    const lines = list.map((r) => {
      const when = Math.floor(r.ends_at / 1000);
      return `\`#${r.id}\` — <t:${when}:R> (<t:${when}:f>)\n> ${r.content}`;
    });

    return message.reply({
      embeds: [
        info(
          `${lines.join('\n\n')}\n\nCancel with \`+remind cancel <id>\``,
          `Your reminders (${list.length})`
        ),
      ],
    });
  },
};
