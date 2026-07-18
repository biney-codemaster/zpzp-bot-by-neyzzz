const { EmbedBuilder } = require('discord.js');
const { color, success, error } = require('../../utils/embeds');

module.exports = {
  name: 'suggest',
  description: 'Envoie une suggestion',
  category: 'suggestions',
  aliases: ['suggestion'],
  usage: '<idée>',
  cooldown: 10,
  async execute(client, message, args) {
    const content = args.join(' ');
    if (!content) return message.reply({ embeds: [error('Écris ta suggestion.')] });
    const guild = client.db.ensureGuild(message.guild.id);
    if (!guild.suggestion_channel) {
      return message.reply({ embeds: [error('Aucun salon configuré. Un admin doit faire `+setsuggest #salon`.')] });
    }
    const channel = message.guild.channels.cache.get(guild.suggestion_channel);
    if (!channel) return message.reply({ embeds: [error('Salon de suggestions introuvable.')] });

    const embed = new EmbedBuilder()
      .setColor(color())
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
      .setTitle('💡 Nouvelle suggestion')
      .setDescription(content)
      .setFooter({ text: 'En attente • Réagis avec 👍 / 👎' })
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    await msg.react('👍');
    await msg.react('👎');
    client.db.addSuggestion(msg.id, message.guild.id, message.author.id, content);
    await message.delete().catch(() => null);
    return message.channel.send({ embeds: [success(`Suggestion envoyée dans ${channel}`)] }).then((m) => setTimeout(() => m.delete().catch(() => null), 5000));
  },
};
