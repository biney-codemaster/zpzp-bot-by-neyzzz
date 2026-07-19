const { EmbedBuilder } = require('discord.js');
const { success, error, color } = require('../../utils/embeds');
const { hasLevel } = require('../../utils/permissions');

module.exports = {
  name: 'close',
  description: 'Ferme le ticket actuel',
  category: 'tickets',
  aliases: ['ticketclose'],
  permLevel: 'user',
  async execute(client, message) {
    const ticket = client.db.getTicket(message.channel.id);
    if (!ticket || ticket.closed) return message.reply({ embeds: [error("Ce n'est pas un ticket ouvert.")] });
    const g = client.db.ensureGuild(message.guild.id);
    const allowed =
      hasLevel(message.member, 'mod', g, client.config.ownerIds) ||
      (g.ticket_support_role && message.member.roles.cache.has(g.ticket_support_role)) ||
      ticket.user_id === message.author.id;
    if (!allowed) return message.reply({ embeds: [error('Tu ne peux pas fermer ce ticket.')] });
    await message.reply({ embeds: [success('Fermeture dans 5 secondes…')] });
    client.db.closeTicket(message.channel.id);
    if (g.ticket_log) {
      const log = message.guild.channels.cache.get(g.ticket_log);
      if (log) {
        await log.send({
          embeds: [new EmbedBuilder().setColor(color()).setTitle('Ticket fermé').addFields(
            { name: 'Salon', value: message.channel.name, inline: true },
            { name: 'Auteur', value: `<@${ticket.user_id}>`, inline: true },
            { name: 'Par', value: `${message.author}`, inline: true }
          ).setTimestamp()],
        }).catch(() => null);
      }
    }
    setTimeout(() => message.channel.delete('Ticket fermé').catch(() => null), 5000);
  },
};
