const {
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const { parseChannel, parseRole } = require('../../utils/helpers');
const { success, error, color } = require('../../utils/embeds');
const { withEmoji } = require('../../utils/emoji');
const { panelComponents } = require('../../services/tickets');

module.exports = {
  name: 'ticketsetup',
  description: 'Post the support ticket panel',
  category: 'tickets',
  usage: '<category_id> [panel_channel] [support_role] [log_channel]',
  permLevel: 'admin',
  botPermissions: [PermissionFlagsBits.ManageChannels],
  async execute(client, message, args) {
    const category = message.guild.channels.cache.get(
      (args[0] || '').replace(/[<#>]/g, '')
    );

    if (!category || category.type !== ChannelType.GuildCategory) {
      return message.reply({
        embeds: [
          error(
            'Provide a category ID.\n`+ticketsetup CATEGORY_ID #panel @Support #logs`'
          ),
        ],
      });
    }

    const panel = parseChannel(message, args[1]) || message.channel;
    const support = parseRole(message, args[2]);
    const log = parseChannel(message, args[3]);

    if (!support) {
      return message.reply({
        embeds: [error('Provide a support role.\n`+ticketsetup CATEGORY_ID #panel @Support #logs`')],
      });
    }

    client.db.updateGuild(message.guild.id, {
      ticket_category: category.id,
      ticket_support_role: support.id,
      ticket_log: log?.id || null,
    });

    await panel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(withEmoji('tickets', 'Support'))
          .setDescription(
            [
              'Need help? Open a private support ticket.',
              '',
              'One open ticket per user.',
              'Staff will respond as soon as possible.',
            ].join('\n')
          )
          .setFooter({ text: message.guild.name }),
      ],
      components: panelComponents(),
    });

    return message.reply({
      embeds: [
        success(
          [
            `Panel posted in ${panel}.`,
            `Category: **${category.name}**`,
            `Support role: ${support}`,
            log ? `Logs: ${log}` : 'Logs: not set',
          ].join('\n')
        ),
      ],
    });
  },
};
