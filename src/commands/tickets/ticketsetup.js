const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { parseChannel, parseRole } = require('../../utils/helpers');
const { success, error, color } = require('../../utils/embeds');
const { applyComponentEmoji, withEmoji } = require('../../utils/emoji');

module.exports = {
  name: 'ticketsetup',
  description: 'Configure tickets and send the panel',
  category: 'tickets',
  usage: '<category_id> [panel_channel] [support_role] [log_channel]',
  permLevel: 'admin',
  botPermissions: [PermissionFlagsBits.ManageChannels],
  async execute(client, message, args) {
    const category = message.guild.channels.cache.get((args[0] || '').replace(/[<#>]/g, ''));
    if (!category || category.type !== ChannelType.GuildCategory) {
      return message.reply({ embeds: [error('Provide a category ID.\n`+ticketsetup CATEGORY_ID #panel @Support #logs`')] });
    }
    const panel = parseChannel(message, args[1]) || message.channel;
    const support = parseRole(message, args[2]);
    const log = parseChannel(message, args[3]);
    client.db.updateGuild(message.guild.id, {
      ticket_category: category.id,
      ticket_support_role: support?.id || null,
      ticket_log: log?.id || null,
    });

    const openBtn = new ButtonBuilder()
      .setCustomId('ticket_create')
      .setLabel('Open a ticket')
      .setStyle(ButtonStyle.Primary);
    applyComponentEmoji(openBtn, 'tickets');

    await panel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(withEmoji('tickets', 'Support'))
          .setDescription('Click the button below to open a ticket.')
          .setFooter({ text: message.guild.name }),
      ],
      components: [new ActionRowBuilder().addComponents(openBtn)],
    });
    return message.reply({ embeds: [success(`Panel sent in ${panel}.`)] });
  },
};
