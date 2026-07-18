const { EmbedBuilder } = require('discord.js');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'deny',
  description: 'Refuse une suggestion (ID message)',
  category: 'suggestions',
  aliases: ['denysuggest', 'reject'],
  usage: '<message_id> [raison]',
  permissions: ['ManageGuild'],
  async execute(client, message, args) {
    const id = args[0];
    const reason = args.slice(1).join(' ') || 'Aucune raison';
    const suggestion = client.db.getSuggestion(id);
    if (!suggestion) return message.reply({ embeds: [error('Suggestion introuvable.')] });
    const channel = message.guild.channels.cache.get(client.db.ensureGuild(message.guild.id).suggestion_channel);
    const msg = channel ? await channel.messages.fetch(id).catch(() => null) : null;
    if (msg) {
      const embed = EmbedBuilder.from(msg.embeds[0] || {})
        .setColor(0xed4245)
        .setFooter({ text: `Refusée par ${message.author.tag} • ${reason}` });
      await msg.edit({ embeds: [embed] });
    }
    client.db.updateSuggestion(id, 'denied');
    return message.reply({ embeds: [success('Suggestion refusée.')] });
  },
};
