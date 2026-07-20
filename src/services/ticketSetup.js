const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { color } = require('../utils/embeds');
const { applyComponentEmoji, withEmoji } = require('../utils/emoji');
const { panelComponents } = require('./tickets');

function statusLine(ok, value) {
  return ok ? value : '`Not set`';
}

function buildSetupEmbed(guild, guildData) {
  const category = guildData.ticket_category
    ? guild.channels.cache.get(guildData.ticket_category)
    : null;
  const support = guildData.ticket_support_role
    ? guild.roles.cache.get(guildData.ticket_support_role)
    : null;
  const logs = guildData.ticket_log
    ? guild.channels.cache.get(guildData.ticket_log)
    : null;

  const ready = Boolean(category && support);

  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('tickets', 'Ticket setup'))
    .setDescription(
      [
        'Configure each option from the menu below.',
        'When category + support role are set, you can post the panel.',
      ].join('\n')
    )
    .addFields(
      {
        name: 'Category',
        value: statusLine(category, `${category}`),
        inline: true,
      },
      {
        name: 'Support role',
        value: statusLine(support, `${support}`),
        inline: true,
      },
      {
        name: 'Log channel',
        value: statusLine(logs, `${logs}`),
        inline: true,
      },
      {
        name: 'Status',
        value: ready ? '`Ready to post`' : '`Incomplete`',
        inline: false,
      }
    )
    .setFooter({ text: guild.name })
    .setTimestamp();
}

function mainMenu(userId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`tsetup_menu:${userId}`)
    .setPlaceholder('Choose what to configure...')
    .addOptions(
      {
        label: 'Category',
        value: 'category',
        description: 'Where ticket channels are created',
      },
      {
        label: 'Support role',
        value: 'support',
        description: 'Staff role that can see tickets',
      },
      {
        label: 'Log channel',
        value: 'logs',
        description: 'Open / close / delete logs',
      },
      {
        label: 'Post panel',
        value: 'panel',
        description: 'Send the Open ticket panel',
      },
      {
        label: 'Clear logs',
        value: 'clear_logs',
        description: 'Remove the ticket log channel',
      }
    );

  const close = new ButtonBuilder()
    .setCustomId(`tsetup_close:${userId}`)
    .setLabel('Close')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(close, 'close');

  return [
    new ActionRowBuilder().addComponents(menu),
    new ActionRowBuilder().addComponents(close),
  ];
}

function backRow(userId) {
  const back = new ButtonBuilder()
    .setCustomId(`tsetup_back:${userId}`)
    .setLabel('Back')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(back, 'home');
  return new ActionRowBuilder().addComponents(back);
}

function categoryPicker(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`tsetup_category:${userId}`)
        .setPlaceholder('Select a category...')
        .setChannelTypes(ChannelType.GuildCategory)
        .setMinValues(1)
        .setMaxValues(1)
    ),
    backRow(userId),
  ];
}

function supportPicker(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(`tsetup_support:${userId}`)
        .setPlaceholder('Select the support role...')
        .setMinValues(1)
        .setMaxValues(1)
    ),
    backRow(userId),
  ];
}

function logsPicker(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`tsetup_logs:${userId}`)
        .setPlaceholder('Select the log channel...')
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setMinValues(1)
        .setMaxValues(1)
    ),
    backRow(userId),
  ];
}

function panelPicker(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`tsetup_panel:${userId}`)
        .setPlaceholder('Select where to post the panel...')
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setMinValues(1)
        .setMaxValues(1)
    ),
    backRow(userId),
  ];
}

function pickerEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('tickets', title))
    .setDescription(description)
    .setTimestamp();
}

async function postPanel(guild, channel, guildData) {
  return channel.send({
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
        .setFooter({ text: guild.name }),
    ],
    components: panelComponents(),
  });
}

function assertOwner(interaction, userId) {
  return interaction.user.id === userId;
}

module.exports = {
  buildSetupEmbed,
  mainMenu,
  categoryPicker,
  supportPicker,
  logsPicker,
  panelPicker,
  pickerEmbed,
  postPanel,
  assertOwner,
};
