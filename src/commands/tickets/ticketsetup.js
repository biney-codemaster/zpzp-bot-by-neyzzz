const { PermissionFlagsBits } = require('discord.js');
const {
  buildSetupEmbed,
  mainMenu,
} = require('../../services/ticketSetup');

module.exports = {
  name: 'ticketsetup',
  description: 'Open the interactive ticket setup menu',
  category: 'tickets',
  aliases: ['ticketssetup', 'setuptickets'],
  usage: '',
  permLevel: 'owner',
  botPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 5,
  async execute(client, message) {
    const guildData = client.db.ensureGuild(message.guild.id);

    return message.reply({
      embeds: [buildSetupEmbed(message.guild, guildData)],
      components: mainMenu(message.author.id),
    });
  },
};
