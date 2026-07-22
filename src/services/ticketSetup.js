const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { color } = require('../utils/embeds');
const { applyComponentEmoji, withEmoji } = require('../utils/emoji');
const {
  panelComponents,
  DEFAULT_PANEL_TITLE,
  DEFAULT_PANEL_DESCRIPTION,
  getPanelTitle,
  getPanelDescription,
} = require('./tickets');

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
  const panelTitle = getPanelTitle(guildData);
  const panelDescription = getPanelDescription(guildData);

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
        name: 'Panel title',
        value: panelTitle.slice(0, 256),
        inline: true,
      },
      {
        name: 'Status',
        value: ready ? '`Ready to post`' : '`Incomplete`',
        inline: true,
      },
      {
        name: 'Panel text',
        value: panelDescription.slice(0, 1024),
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
        label: 'Panel text',
        value: 'panel_text',
        description: 'Edit panel title and description',
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

function panelTextModal(guildData) {
  return new ModalBuilder()
    .setCustomId('tsetup_panel_text_modal')
    .setTitle('Panel text')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_title')
          .setLabel('Title')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(256)
          .setValue(getPanelTitle(guildData).slice(0, 256))
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_description')
          .setLabel('Description')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(2000)
          .setValue(getPanelDescription(guildData).slice(0, 2000))
      )
    );
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
        .setTitle(withEmoji('tickets', getPanelTitle(guildData)))
        .setDescription(getPanelDescription(guildData))
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
  panelTextModal,
  pickerEmbed,
  postPanel,
  assertOwner,
  DEFAULT_PANEL_TITLE,
  DEFAULT_PANEL_DESCRIPTION,
};
