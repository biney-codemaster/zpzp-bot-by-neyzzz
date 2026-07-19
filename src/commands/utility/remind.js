const { parseDuration, formatDuration } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'remind',
  description: 'Crée un rappel',
  category: 'utility',
  aliases: ['rappel', 'reminder'],
  usage: '<durée> <message>',
  permLevel: 'user',
  cooldown: 5,
  async execute(client, message, args) {
    const duration = parseDuration(args[0]);
    const content = args.slice(1).join(' ');
    if (!duration || !content) return message.reply({ embeds: [error('Usage : `+remind 10m texte`')] });
    if (duration < 10000 || duration > 30 * 24 * 60 * 60 * 1000) {
      return message.reply({ embeds: [error('Entre 10s et 30 jours.')] });
    }
    client.db.addReminder(message.guild.id, message.channel.id, message.author.id, content, Date.now() + duration);
    return message.reply({ embeds: [success(`Rappel dans **${formatDuration(duration)}**.\n> ${content}`)] });
  },
};
