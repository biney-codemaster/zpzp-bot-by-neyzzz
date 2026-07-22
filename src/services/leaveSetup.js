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
  DEFAULT_LEAVE,
  DEFAULT_LEAVE_MESSAGE,
} = require('./configDefaults');

function statusLine(ok, value) {
  return ok ? value : '`Not set`';
}

function buildLeaveEmbed(guild, guildData) {
  const channel = guildData.leave_channel
    ? guild.channels.cache.get(guildData.leave_channel)
    : null;
  const message = guildData.leave_message || DEFAULT_LEAVE_MESSAGE;

  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('config', 'Leave setup'))
    .setDescription(
      [
        'Pick a channel below to set the leave channel.',
        'Use the second menu for message, preview, disable, or reset.',
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
  const channel = new ChannelSelectMenuBuilder()
    .setCustomId(`lsetup_channel:${userId}`)
    .setPlaceholder('Select leave channel...')
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    .setMinValues(1)
    .setMaxValues(1);

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`lsetup_menu:${userId}`)
    .setPlaceholder('Message, preview, disable, reset...')
    .addOptions(
      {
        label: 'Message',
        value: 'message',
        description: 'Edit the leave message',
      },
      {
        label: 'Preview',
        value: 'preview',
        description: 'Preview with your account',
      },
      {
        label: 'Disable',
        value: 'disable',
        description: 'Turn leave messages off',
      },
      {
        label: 'Reset',
        value: 'reset',
        description: 'Reset leave to defaults',
      }
    );

  const close = new ButtonBuilder()
    .setCustomId(`lsetup_close:${userId}`)
    .setLabel('Close')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(close, 'close');

  return [
    new ActionRowBuilder().addComponents(channel),
    new ActionRowBuilder().addComponents(menu),
    new ActionRowBuilder().addComponents(close),
  ];
}

function messageModal(guildData) {
  return new ModalBuilder()
    .setCustomId('lsetup_message_modal')
    .setTitle('Leave message')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('leave_message')
          .setLabel('Message')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000)
          .setValue(
            (guildData.leave_message || DEFAULT_LEAVE_MESSAGE).slice(0, 1000)
          )
      )
    );
}

function buildPreviewEmbed(member, guildData) {
  const text = replacePlaceholders(
    guildData.leave_message || DEFAULT_LEAVE_MESSAGE,
    {
      user: member.user,
      guild: member.guild,
      memberCount: member.guild.memberCount,
    }
  );

  return new EmbedBuilder()
    .setColor(color())
    .setTitle('Goodbye')
    .setDescription(text)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: 'Preview' })
    .setTimestamp();
}

function resetLeave(db, guildId) {
  return db.updateGuild(guildId, { ...DEFAULT_LEAVE });
}

function assertOwner(interaction, ownerId) {
  return interaction.user.id === ownerId;
}

module.exports = {
  buildLeaveEmbed,
  mainMenu,
  messageModal,
  buildPreviewEmbed,
  resetLeave,
  assertOwner,
};
