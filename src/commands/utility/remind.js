const { parseDuration, formatDuration } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
module.exports = {
  name: 'remind', description: 'Set a reminder', category: 'utility', aliases: ['reminder'], usage: '<duration> <message>', permLevel: 'user', cooldown: 5,
  async execute(client, message, args) {
    const duration = parseDuration(args[0]);
    const content = args.slice(1).join(' ');
    if (!duration || !content) return message.reply({ embeds: [error('Usage: `+remind 10m text`')] });
    if (duration < 10000 || duration > 30 * 24 * 60 * 60 * 1000) return message.reply({ embeds: [error('Between 10s and 30 days.')] });
    client.db.addReminder(message.guild.id, message.channel.id, message.author.id, content, Date.now() + duration);
    return message.reply({ embeds: [success(`Reminder in **${formatDuration(duration)}**.\n> ${content}`)] });
  },
};
