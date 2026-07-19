const { PermissionFlagsBits } = require('discord.js');
const { fetchMember } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'add',
  description: 'Add a member to the ticket',
  category: 'tickets',
  aliases: ['ticketadd'],
  usage: '<member>',
  permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.ManageChannels],
  async execute(client, message, args) {
    const ticket = client.db.getTicket(message.channel.id);
    if (!ticket || ticket.closed) return message.reply({ embeds: [error('This is not a ticket.')] });
    const member = await fetchMember(message, args[0]);
    if (!member) return message.reply({ embeds: [error('Member not found.')] });
    await message.channel.permissionOverwrites.edit(member.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    return message.reply({ embeds: [success(`${member} added.`)] });
  },
};
