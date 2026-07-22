const { PermissionFlagsBits } = require('discord.js');
const { success, error } = require('../../utils/embeds');
const { isTicketStaff, renameTicket } = require('../../services/tickets');

module.exports = {
  name: 'trename',
  description: 'Rename the current ticket channel',
  category: 'tickets',
  aliases: ['ticketrename'],
  usage: '<name>',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.ManageChannels],
  async execute(client, message, args) {
    const guildData = client.db.ensureGuild(message.guild.id);
    if (!isTicketStaff(message.member, guildData, client.config.ownerIds)) {
      return message.reply({ embeds: [error('Only ticket staff can use this.')] });
    }

    const name = args.join(' ').trim();
    if (!name) {
      return message.reply({ embeds: [error('Usage: `+trename <name>`')] });
    }

    const result = await renameTicket(
      client,
      message.channel,
      message.author,
      name
    );

    if (!result.ok) {
      return message.reply({ embeds: [error(result.message)] });
    }

    return message.reply({
      embeds: [success(`Ticket renamed to \`${result.name}\`.`)],
    });
  },
};
