const { parseDuration, formatDuration } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'remind',
  description: 'Set or cancel a reminder',
  category: 'utility',
  aliases: ['reminder'],
  usage: '<duration> <message> | cancel <id>',
  permLevel: 'user',
  cooldown: 5,
  async execute(client, message, args) {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'cancel' || sub === 'delete' || sub === 'remove') {
      const id = Number(args[1]);
      if (!id) {
        return message.reply({
          embeds: [error('Usage: `+remind cancel <id>` — see `+reminders`.')],
        });
      }
      const changes = client.db.cancelReminder(id, message.author.id);
      if (!changes) {
        return message.reply({
          embeds: [error('Reminder not found (or already sent).')],
        });
      }
      return message.reply({
        embeds: [success(`Reminder \`#${id}\` cancelled.`)],
      });
    }

    const duration = parseDuration(args[0]);
    const content = args.slice(1).join(' ');
    if (!duration || !content) {
      return message.reply({
        embeds: [
          error(
            'Usage: `+remind 10m text` or `+remind cancel <id>`\nList yours with `+reminders`.'
          ),
        ],
      });
    }
    if (duration < 10000 || duration > 30 * 24 * 60 * 60 * 1000) {
      return message.reply({
        embeds: [error('Between 10s and 30 days.')],
      });
    }

    const id = client.db.addReminder(
      message.guild.id,
      message.channel.id,
      message.author.id,
      content.slice(0, 500),
      Date.now() + duration
    );

    return message.reply({
      embeds: [
        success(
          `Reminder \`#${id}\` in **${formatDuration(duration)}**.\n> ${content.slice(0, 500)}`
        ),
      ],
    });
  },
};
