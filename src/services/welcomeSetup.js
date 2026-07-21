const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { color } = require('../utils/embeds');
const { applyComponentEmoji, withEmoji } = require('../utils/emoji');
const { replacePlaceholders } = require('../utils/helpers');
const {
  DEFAULT_WELCOME,
  DEFAULT_WELCOME_MESSAGE,
} = require('./configDefaults');

function statusLine(ok, value) {
  return ok ? value : '`Not set`';
}

function buildWelcomeEmbed(guild, guildData) {
  const channel = guildData.welcome_channel
    ? guild.channels.cache.get(guildData.welcome_channel)
    : null;
  const message = guildData.welcome_message || DEFAULT_WELCOME_MESSAGE;

  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('config', 'Welcome setup'))
    .setDescription(
      [
        'Configure the welcome channel and message from the menu below.',
        '',
        'Placeholders: `{user}` `{user.name}` `{user.tag}` `{user.id}` `{server}` `{server.id}` `{count}`',
      ].join('\n')
    )
    .addFields(
      {
        name: 'Channel',
        value: statusLine(channel, `${channel}`),
        inline: true,
      },
      {
        name: 'Status',
        value: channel ? '`Enabled`' : '`Disabled`',
        inline: true,
      },
      {
        name: 'Message',
        value: message.slice(0, 1024) || '`Empty`',
        inline: false,
      }
    )
    .setFooter({ text: guild.name })
    .setTimestamp();
}

function mainMenu(userId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`wsetup_menu:${userId}`)
    .setPlaceholder('Choose what to configure...')
    .addOptions(
      {
        label: 'Channel',
        value: 'channel',
        description: 'Set the welcome channel',
      },
      {
        label: 'Message',
        value: 'message',
        description: 'Edit the welcome message',
      },
      {
        label: 'Preview',
        value: 'preview',
        description: 'Preview with your account',
      },
      {
        label: 'Disable',
        value: 'disable',
        description: 'Turn welcome messages off',
      },
      {
        label: 'Reset',
        value: 'reset',
        description: 'Reset welcome to defaults',
      }
    );

  const close = new ButtonBuilder()
    .setCustomId(`wsetup_close:${userId}`)
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
    .setCustomId(`wsetup_back:${userId}`)
    .setLabel('Back')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(back, 'home');
  return new ActionRowBuilder().addComponents(back);
}

function channelPicker(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`wsetup_channel:${userId}`)
        .setPlaceholder('Select a welcome channel...')
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setMinValues(1)
        .setMaxValues(1)
    ),
    backRow(userId),
  ];
}

function messageModal(guildData) {
  return new ModalBuilder()
    .setCustomId('wsetup_message_modal')
    .setTitle('Welcome message')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('welcome_message')
          .setLabel('Message')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000)
          .setValue(
            (guildData.welcome_message || DEFAULT_WELCOME_MESSAGE).slice(0, 1000)
          )
      )
    );
}

function pickerEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('config', title))
    .setDescription(description)
    .setTimestamp();
}

function buildPreviewEmbed(member, guildData) {
  const text = replacePlaceholders(
    guildData.welcome_message || DEFAULT_WELCOME_MESSAGE,
    {
      user: member.user,
      guild: member.guild,
      memberCount: member.guild.memberCount,
    }
  );

  return new EmbedBuilder()
    .setColor(color())
    .setTitle('Welcome')
    .setDescription(text)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: `${member.guild.memberCount} members · Preview` })
    .setTimestamp();
}

function resetWelcome(db, guildId) {
  return db.updateGuild(guildId, { ...DEFAULT_WELCOME });
}

function assertOwner(interaction, ownerId) {
  return interaction.user.id === ownerId;
}

module.exports = {
  buildWelcomeEmbed,
  mainMenu,
  channelPicker,
  messageModal,
  pickerEmbed,
  buildPreviewEmbed,
  resetWelcome,
  assertOwner,
};
