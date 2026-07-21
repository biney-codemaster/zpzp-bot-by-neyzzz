const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { color } = require('../utils/embeds');
const { applyComponentEmoji, withEmoji } = require('../utils/emoji');
const { getGiveawaySettings, requirementLines } = require('./giveaways');

function statusLine(ok, value) {
  return ok ? value : '`Not set`';
}

function onOff(value) {
  return value ? '`ON`' : '`OFF`';
}

function buildSetupEmbed(guild, guildData) {
  const settings = getGiveawaySettings(guildData);
  const required = settings.requiredRole
    ? guild.roles.cache.get(settings.requiredRole)
    : null;
  const bonus = settings.bonusRole
    ? guild.roles.cache.get(settings.bonusRole)
    : null;
  const reqLines = requirementLines(settings, guild);

  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('giveaways', 'Giveaway setup'))
    .setDescription(
      'Configure default giveaway rules applied to new giveaways started with `+gstart`.'
    )
    .addFields(
      {
        name: 'Required role',
        value: statusLine(required, `${required}`),
        inline: true,
      },
      {
        name: 'Min account age',
        value:
          settings.minAccountDays > 0
            ? `\`${settings.minAccountDays} day(s)\``
            : '`Disabled`',
        inline: true,
      },
      {
        name: 'Boosters only',
        value: onOff(settings.boostersOnly),
        inline: true,
      },
      {
        name: 'Bonus role',
        value: statusLine(bonus, `${bonus}`),
        inline: true,
      },
      {
        name: 'Bonus entries',
        value:
          settings.bonusRole && settings.bonusEntries > 0
            ? `\`+${settings.bonusEntries}\` extra`
            : '`Disabled`',
        inline: true,
      },
      {
        name: 'Ping winners on end',
        value: onOff(settings.pingOnEnd),
        inline: true,
      },
      {
        name: 'Active rules preview',
        value: reqLines.length ? reqLines.join('\n') : 'No requirements configured.',
      }
    )
    .setFooter({ text: guild.name })
    .setTimestamp();
}

function mainMenu(userId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`gsetup_menu:${userId}`)
    .setPlaceholder('Choose what to configure...')
    .addOptions(
      {
        label: 'Required role',
        value: 'required_role',
        description: 'Role needed to enter giveaways',
      },
      {
        label: 'Min account age',
        value: 'min_age',
        description: 'Minimum account age in days',
      },
      {
        label: 'Boosters only',
        value: 'boosters',
        description: 'Toggle boosters-only entries',
      },
      {
        label: 'Bonus role',
        value: 'bonus_role',
        description: 'Role that grants extra entries',
      },
      {
        label: 'Bonus entries',
        value: 'bonus_entries',
        description: 'Extra entries for bonus role',
      },
      {
        label: 'Ping on end',
        value: 'ping',
        description: 'Ping winners when a giveaway ends',
      },
      {
        label: 'Clear required role',
        value: 'clear_required',
        description: 'Remove required role rule',
      },
      {
        label: 'Clear bonus role',
        value: 'clear_bonus',
        description: 'Remove bonus entries setup',
      }
    );

  const close = new ButtonBuilder()
    .setCustomId(`gsetup_close:${userId}`)
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
    .setCustomId(`gsetup_back:${userId}`)
    .setLabel('Back')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(back, 'home');
  return new ActionRowBuilder().addComponents(back);
}

function rolePicker(userId, field) {
  const menu = new RoleSelectMenuBuilder()
    .setCustomId(`gsetup_role:${field}:${userId}`)
    .setPlaceholder('Select a role...')
    .setMinValues(1)
    .setMaxValues(1);
  return [new ActionRowBuilder().addComponents(menu), backRow(userId)];
}

function minAgeModal(current = 0) {
  const modal = new ModalBuilder()
    .setCustomId('gsetup_min_age_modal')
    .setTitle('Minimum account age')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('days')
          .setLabel('Days (0 = disabled)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(4)
          .setValue(String(current || 0))
      )
    );
  return modal;
}

function bonusEntriesModal(current = 0) {
  const modal = new ModalBuilder()
    .setCustomId('gsetup_bonus_entries_modal')
    .setTitle('Bonus entries')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('amount')
          .setLabel('Extra entries for bonus role (0 = off)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(3)
          .setValue(String(current || 0))
      )
    );
  return modal;
}

function pickerEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('giveaways', title))
    .setDescription(description);
}

function assertOwner(interaction, ownerId) {
  return interaction.user.id === ownerId;
}

module.exports = {
  buildSetupEmbed,
  mainMenu,
  backRow,
  rolePicker,
  minAgeModal,
  bonusEntriesModal,
  pickerEmbed,
  assertOwner,
};
