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
  DEFAULT_AUTOMOD,
  parseJsonArray,
  actionLabel,
} = require('./configDefaults');

function onOff(value) {
  return value ? '`ON`' : '`OFF`';
}

function formatIdList(ids, formatter) {
  if (!ids.length) return '`None`';
  return ids
    .slice(0, 15)
    .map((id) => formatter(id))
    .join(', ')
    .slice(0, 1024);
}

function buildAutomodEmbed(guild, guildData) {
  const words = parseJsonArray(guildData.badwords);
  const ignoreChannels = parseJsonArray(guildData.automod_ignore_channels);
  const ignoreRoles = parseJsonArray(guildData.automod_ignore_roles);
  const timeoutSec = Number(guildData.automod_timeout_seconds) || 30;

  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('config', 'Automod setup'))
    .setDescription('Toggle filters, punishments, ignores, and logging below.')
    .addFields(
      {
        name: 'Anti-link',
        value: `${onOff(guildData.automod_antilink)} · ${actionLabel(
          guildData.automod_antilink_action
        )}`,
        inline: true,
      },
      {
        name: 'Anti-spam',
        value: `${onOff(guildData.automod_antispam)} · ${actionLabel(
          guildData.automod_antispam_action
        )}`,
        inline: true,
      },
      {
        name: 'Bad words',
        value: `${onOff(guildData.automod_badwords)} · ${actionLabel(
          guildData.automod_badwords_action
        )} (${words.length})`,
        inline: true,
      },
      {
        name: 'Log to modlog',
        value: onOff(guildData.automod_log),
        inline: true,
      },
      {
        name: 'Timeout duration',
        value: `\`${timeoutSec}s\``,
        inline: true,
      },
      {
        name: 'Ignore channels',
        value: formatIdList(ignoreChannels, (id) => `<#${id}>`),
        inline: false,
      },
      {
        name: 'Ignore roles',
        value: formatIdList(ignoreRoles, (id) => `<@&${id}>`),
        inline: false,
      }
    )
    .setFooter({ text: guild.name })
    .setTimestamp();
}

function mainMenu(userId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`asetup_menu:${userId}`)
    .setPlaceholder('Choose what to configure...')
    .addOptions(
      {
        label: 'Toggle anti-link',
        value: 'toggle_antilink',
        description: 'Enable or disable anti-link',
      },
      {
        label: 'Toggle anti-spam',
        value: 'toggle_antispam',
        description: 'Enable or disable anti-spam',
      },
      {
        label: 'Toggle bad words',
        value: 'toggle_badwords',
        description: 'Enable or disable bad-word filter',
      },
      {
        label: 'Anti-link punishment',
        value: 'punish_antilink',
        description: 'Delete / Warn / Timeout',
      },
      {
        label: 'Anti-spam punishment',
        value: 'punish_antispam',
        description: 'Warn / Timeout',
      },
      {
        label: 'Bad words punishment',
        value: 'punish_badwords',
        description: 'Delete / Warn / Timeout',
      },
      {
        label: 'Ignore channels',
        value: 'ignore_channels',
        description: 'Channels skipped by automod',
      },
      {
        label: 'Ignore roles',
        value: 'ignore_roles',
        description: 'Roles skipped by automod',
      },
      {
        label: 'Toggle modlog',
        value: 'toggle_log',
        description: 'Log automod actions to modlog',
      },
      {
        label: 'Timeout duration',
        value: 'timeout_seconds',
        description: 'Seconds used for timeout punishment',
      },
      {
        label: 'Bad words list',
        value: 'badwords',
        description: 'Add, remove, or list words',
      },
      {
        label: 'Clear ignores',
        value: 'clear_ignores',
        description: 'Clear ignore channels and roles',
      },
      {
        label: 'Reset',
        value: 'reset',
        description: 'Reset all automod settings',
      }
    );

  const close = new ButtonBuilder()
    .setCustomId(`asetup_close:${userId}`)
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
    .setCustomId(`asetup_back:${userId}`)
    .setLabel('Back')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(back, 'home');
  return new ActionRowBuilder().addComponents(back);
}

function punishPicker(userId, kind, options) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`asetup_punish:${userId}:${kind}`)
        .setPlaceholder('Select punishment...')
        .addOptions(options)
    ),
    backRow(userId),
  ];
}

function ignoreChannelPicker(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`asetup_ignore_channels:${userId}`)
        .setPlaceholder('Select channels to ignore...')
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setMinValues(0)
        .setMaxValues(25)
    ),
    backRow(userId),
  ];
}

function ignoreRolePicker(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(`asetup_ignore_roles:${userId}`)
        .setPlaceholder('Select roles to ignore...')
        .setMinValues(0)
        .setMaxValues(25)
    ),
    backRow(userId),
  ];
}

function badwordsMenu(userId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`asetup_badwords_menu:${userId}`)
    .setPlaceholder('Manage bad words...')
    .addOptions(
      {
        label: 'Add word',
        value: 'add',
        description: 'Add a banned word',
      },
      {
        label: 'Remove word',
        value: 'remove',
        description: 'Remove a banned word',
      },
      {
        label: 'List words',
        value: 'list',
        description: 'Show the current list',
      },
      {
        label: 'Clear list',
        value: 'clear',
        description: 'Remove all banned words',
      }
    );

  return [
    new ActionRowBuilder().addComponents(menu),
    backRow(userId),
  ];
}

function removeWordPicker(userId, words) {
  const options = words.slice(0, 25).map((word) => ({
    label: word.slice(0, 100),
    value: word.slice(0, 100),
  }));

  if (!options.length) {
    return [backRow(userId)];
  }

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`asetup_badwords_remove:${userId}`)
        .setPlaceholder('Select a word to remove...')
        .addOptions(options)
    ),
    backRow(userId),
  ];
}

function addWordModal() {
  return new ModalBuilder()
    .setCustomId('asetup_badword_modal')
    .setTitle('Add bad word')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('badword')
          .setLabel('Word')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(64)
      )
    );
}

function timeoutModal(guildData) {
  return new ModalBuilder()
    .setCustomId('asetup_timeout_modal')
    .setTitle('Timeout duration')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('timeout_seconds')
          .setLabel('Seconds (5–600)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(3)
          .setValue(String(Number(guildData.automod_timeout_seconds) || 30))
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

function resetAutomod(db, guildId) {
  return db.updateGuild(guildId, { ...DEFAULT_AUTOMOD });
}

function assertOwner(interaction, ownerId) {
  return interaction.user.id === ownerId;
}

module.exports = {
  buildAutomodEmbed,
  mainMenu,
  punishPicker,
  ignoreChannelPicker,
  ignoreRolePicker,
  badwordsMenu,
  removeWordPicker,
  addWordModal,
  timeoutModal,
  pickerEmbed,
  resetAutomod,
  assertOwner,
  parseJsonArray,
  actionLabel,
};
