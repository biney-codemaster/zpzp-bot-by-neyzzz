const { fetchMember } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const { isTicketStaff, addUserToTicket } = require('../../services/tickets');

module.exports = {
  name: 'tadd',
  description: 'Add a user to the current ticket',
  category: 'tickets',
  aliases: ['ticketadd'],
  usage: '<member>',
  permLevel: 'mod',
  async execute(client, message, args) {
    const guildData = client.db.ensureGuild(message.guild.id);
    if (!isTicketStaff(message.member, guildData, client.config.ownerIds)) {
      return message.reply({ embeds: [error('Only ticket staff can use this.')] });
    }

    const member = await fetchMember(message, args[0]);
    if (!member) {
      return message.reply({ embeds: [error('Invalid member.')] });
    }

    const result = await addUserToTicket(
      client,
      message.channel,
      message.author,
      member.user
    );

    if (!result.ok) {
      return message.reply({ embeds: [error(result.message)] });
    }

    return message.reply({ embeds: [success(`${member} added to the ticket.`)] });
  },
};
