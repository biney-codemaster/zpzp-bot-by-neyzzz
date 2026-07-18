const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const { parseChannel, parseRole } = require('../../utils/helpers');
const { success, error, color } = require('../../utils/embeds');

module.exports = {
  name: 'ticketsetup',
  description: 'Configure le système de tickets et envoie le panel',
  category: 'tickets',
  usage: '<catégorie> [salon_panel] [rôle_support] [salon_logs]',
  permissions: ['ManageGuild'],
  botPermissions: ['ManageChannels'],
  async execute(client, message, args) {
    const category = message.guild.channels.cache.get(args[0]?.replace(/[<#>]/g, ''))
      || message.guild.channels.cache.find((c) => c.name === args[0] && c.type === ChannelType.GuildCategory);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return message.reply({ embeds: [error('Donne une catégorie valide (ID).\nExemple : `+ticketsetup CATEGORY_ID #panel @Support #logs`')] });
    }

    const panelChannel = parseChannel(message, args[1]) || message.channel;
    const supportRole = parseRole(message, args[2]);
    const logChannel = parseChannel(message, args[3]);

    client.db.updateGuild(message.guild.id, {
      ticket_category: category.id,
      ticket_support_role: supportRole?.id || null,
      ticket_log: logChannel?.id || null,
    });

    const embed = new EmbedBuilder()
      .setColor(color())
      .setTitle('🎫 Support')
      .setDescription('Clique sur le bouton ci-dessous pour ouvrir un ticket.\nUn membre du staff te répondra dès que possible.')
      .setFooter({ text: message.guild.name });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_create').setLabel('Ouvrir un ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
    );

    await panelChannel.send({ embeds: [embed], components: [row] });
    return message.reply({ embeds: [success(`Panel envoyé dans ${panelChannel}.${supportRole ? ` Rôle support : ${supportRole}` : ''}`)] });
  },
};
