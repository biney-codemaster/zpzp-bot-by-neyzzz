const { success, error } = require('../../utils/embeds');
const { isTicketStaff, performClose } = require('../../services/tickets');
const config = require('../../../config');

module.exports = {
  name: 'tclose',
  description: 'Close the current ticket',
  category: 'tickets',
  aliases: ['ticketclose', 'close'],
  usage: '[reason]',
  permLevel: 'mod',
  async execute(client, message, args) {
    const guildData = client.db.ensureGuild(message.guild.id);
    if (!isTicketStaff(message.member, guildData, client.config.ownerIds)) {
      return message.reply({ embeds: [error('Only ticket staff can use this.')] });
    }

    const ticket = client.db.getTicket(message.channel.id);
    if (!ticket || ticket.closed) {
      return message.reply({ embeds: [error('This is not an open ticket.')] });
    }

    const reason = args.join(' ').trim() || null;
    const pending = await message.reply({
      embeds: [success('Closing ticket and generating transcript...')],
    });

    const result = await performClose(client, {
      guild: message.guild,
      channel: message.channel,
      closer: message.author,
      reason,
    });

    if (!result.ok) {
      return pending.edit({ embeds: [error(result.message)] });
    }

    return pending.edit({
      embeds: [
        success(
          `Ticket closed. Channel deletes in ${Math.floor(config.tickets.deleteDelayMs / 1000)}s.`
        ),
      ],
    });
  },
};
