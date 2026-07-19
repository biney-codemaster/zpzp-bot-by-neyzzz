const { PermissionFlagsBits } = require('discord.js');
const { fetchMember } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'add', description: 'Ajoute un membre au ticket', category: 'tickets', aliases: ['ticketadd'], usage: '<membre>', permLevel: 'mod',
  botPermissions: [PermissionFlagsBits.ManageChannels],
  async execute(client, message, args) {
    const ticket = client.db.getTicket(message.channel.id);
    if (!ticket || ticket.closed) return message.reply({ embeds: [error("Ce n'est pas un ticket.")] });
    const member = await fetchMember(message, args[0]);
    if (!member) return message.reply({ embeds: [error('Membre introuvable.')] });
    await message.channel.permissionOverwrites.edit(member.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    return message.reply({ embeds: [success(`${member} ajouté.`)] });
  },
};
