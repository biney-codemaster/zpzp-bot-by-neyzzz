const { EmbedBuilder } = require('discord.js');
const { success, error, color } = require('../../utils/embeds');
const { hasLevel } = require('../../utils/permissions');

module.exports = {
  name: 'close',
  description: 'Close the current ticket',
  category: 'tickets',
  aliases: ['ticketclose'],
  permLevel: 'user',
  async execute(client, message) {
    const ticket = client.db.getTicket(message.channel.id);
    if (!ticket || ticket.closed) return message.reply({ embeds: [error('This is not an open ticket.')] });
    const g = client.db.ensureGuild(message.guild.id);
    const allowed =
      hasLevel(message.member, 'mod', g, client.config.ownerIds) ||
      (g.ticket_support_role && message.member.roles.cache.has(g.ticket_support_role)) ||
      ticket.user_id === message.author.id;
    if (!allowed) return message.reply({ embeds: [error('You cannot close this ticket.')] });
    await message.reply({ embeds: [success('Closing in 5 seconds...')] });
    client.db.closeTicket(message.channel.id);
    if (g.ticket_log) {
      const log = message.guild.channels.cache.get(g.ticket_log);
      if (log) {
        await log.send({
          embeds: [new EmbedBuilder().setColor(color()).setTitle('Ticket closed').addFields(
            { name: 'Channel', value: message.channel.name, inline: true },
            { name: 'Author', value: `<@${ticket.user_id}>`, inline: true },
            { name: 'Closed by', value: `${message.author}`, inline: true }
          ).setTimestamp()],
        }).catch(() => null);
      }
    }
    setTimeout(() => message.channel.delete('Ticket closed').catch(() => null), 5000);
  },
};
