const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { parseChannel, parseRole } = require('../../utils/helpers');
const { success, error, color } = require('../../utils/embeds');

module.exports = {
  name: 'ticketsetup',
  description: 'Configure les tickets et envoie le panel',
  category: 'tickets',
  usage: '<catégorie_id> [salon_panel] [rôle_support] [salon_logs]',
  permLevel: 'admin',
  botPermissions: [PermissionFlagsBits.ManageChannels],
  async execute(client, message, args) {
    const category = message.guild.channels.cache.get((args[0] || '').replace(/[<#>]/g, ''));
    if (!category || category.type !== ChannelType.GuildCategory) {
      return message.reply({ embeds: [error('Donne l\'ID d\'une catégorie.\n`+ticketsetup CATEGORY_ID #panel @Support #logs`')] });
    }
    const panel = parseChannel(message, args[1]) || message.channel;
    const support = parseRole(message, args[2]);
    const log = parseChannel(message, args[3]);
    client.db.updateGuild(message.guild.id, {
      ticket_category: category.id,
      ticket_support_role: support?.id || null,
      ticket_log: log?.id || null,
    });
    await panel.send({
      embeds: [new EmbedBuilder().setColor(color()).setTitle('Support').setDescription('Clique pour ouvrir un ticket.').setFooter({ text: message.guild.name })],
      components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_create').setLabel('Ouvrir un ticket').setStyle(ButtonStyle.Primary))],
    });
    return message.reply({ embeds: [success(`Panel envoyé dans ${panel}.`)] });
  },
};
