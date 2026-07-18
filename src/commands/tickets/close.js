const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'close',
  description: 'Ferme le ticket actuel',
  category: 'tickets',
  aliases: ['ticketclose', 'fclose'],
  async execute(client, message) {
    const ticket = client.db.getTicket(message.channel.id);
    if (!ticket || ticket.closed) return message.reply({ embeds: [error('Ce salon n\'est pas un ticket ouvert.')] });

    const guildData = client.db.ensureGuild(message.guild.id);
    const isStaff =
      message.member.permissions.has(PermissionFlagsBits.ManageChannels) ||
      (guildData.ticket_support_role && message.member.roles.cache.has(guildData.ticket_support_role)) ||
      ticket.user_id === message.author.id;

    if (!isStaff) return message.reply({ embeds: [error('Tu ne peux pas fermer ce ticket.')] });

    await message.reply({ embeds: [success('Ticket fermé. Suppression dans 5 secondes...')] });
    client.db.closeTicket(message.channel.id);

    if (guildData.ticket_log) {
      const log = message.guild.channels.cache.get(guildData.ticket_log);
      if (log) {
        await log.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xed4245)
              .setTitle('🎫 Ticket fermé')
              .addFields(
                { name: 'Salon', value: message.channel.name, inline: true },
                { name: 'Auteur', value: `<@${ticket.user_id}>`, inline: true },
                { name: 'Fermé par', value: `${message.author}`, inline: true }
              )
              .setTimestamp(),
          ],
        }).catch(() => null);
      }
    }

    setTimeout(() => message.channel.delete('Ticket fermé').catch(() => null), 5000);
  },
};
