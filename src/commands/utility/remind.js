const { parseDuration, formatDuration } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'remind',
  description: 'Crée un rappel',
  category: 'utility',
  aliases: ['reminder', 'rappel'],
  usage: '<durée> <message>',
  cooldown: 5,
  async execute(client, message, args) {
    const duration = parseDuration(args[0]);
    const content = args.slice(1).join(' ');
    if (!duration || !content) return message.reply({ embeds: [error('Usage : `+remind 10m Faire les devoirs`')] });
    if (duration < 10000) return message.reply({ embeds: [error('Minimum 10 secondes.')] });
    if (duration > 30 * 24 * 60 * 60 * 1000) return message.reply({ embeds: [error('Maximum 30 jours.')] });
    client.db.addReminder(message.guild.id, message.channel.id, message.author.id, content, Date.now() + duration);
    return message.reply({ embeds: [success(`⏰ Rappel enregistré dans **${formatDuration(duration)}**.\n> ${content}`)] });
  },
};
