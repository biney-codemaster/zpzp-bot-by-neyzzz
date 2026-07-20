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
  UserSelectMenuBuilder,
} = require('discord.js');
const { color, info } = require('../utils/embeds');
const { applyComponentEmoji, withEmoji } = require('../utils/emoji');
const { formatCaseRow, formatWarnRow, buildCaseEmbed } = require('../utils/modlog');
const { hasLevel } = require('../utils/permissions');

function statusLine(ok, value) {
  return ok ? value : '`Not set`';
}

function thresholdLine(value) {
  return value > 0 ? `\`${value} warns\`` : '`Disabled`';
}

function buildModEmbed(guild, guildData, thresholds) {
  const modlog = guildData.modlog_channel
    ? guild.channels.cache.get(guildData.modlog_channel)
    : null;
  const t = thresholds || {
    mute: 0,
    kick: 0,
    ban: 0,
    muteDuration: '1h',
  };

  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('moderation', 'Moderation panel'))
    .setDescription(
      [
        'Look up cases and warnings, or configure moderation settings.',
        'Sanctions still use prefix commands (`+warn`, `+mute`, etc.).',
      ].join('\n')
    )
    .addFields(
      {
        name: 'Modlog channel',
        value: statusLine(modlog, `${modlog}`),
        inline: true,
      },
      {
        name: 'Mod role',
        value: statusLine(
          guildData.mod_role,
          guild.roles.cache.get(guildData.mod_role)
            ? `${guild.roles.cache.get(guildData.mod_role)}`
            : null
        ),
        inline: true,
      },
      {
        name: 'Auto-warn mute',
        value: thresholdLine(t.mute),
        inline: true,
      },
      {
        name: 'Auto-warn kick',
        value: thresholdLine(t.kick),
        inline: true,
      },
      {
        name: 'Auto-warn ban',
        value: thresholdLine(t.ban),
        inline: true,
      },
      {
        name: 'Auto-mute duration',
        value: `\`${t.muteDuration}\``,
        inline: true,
      }
    )
    .setFooter({ text: guild.name })
    .setTimestamp();
}

function mainMenu(userId, isAdmin) {
  const options = [
    {
      label: 'Lookup case',
      value: 'case',
      description: 'Search by case ID',
    },
    {
      label: 'Member warnings',
      value: 'warnings',
      description: 'View warnings for a member',
    },
    {
      label: 'Member history',
      value: 'history',
      description: 'View moderation history',
    },
    {
      label: 'Recent cases',
      value: 'recent',
      description: 'Last 10 server cases',
    },
  ];

  if (isAdmin) {
    options.push(
      {
        label: 'Modlog channel',
        value: 'modlog',
        description: 'Set where mod actions are logged',
      },
      {
        label: 'Auto-warn thresholds',
        value: 'thresholds',
        description: 'Configure mute/kick/ban thresholds',
      }
    );
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`mod_menu:${userId}`)
    .setPlaceholder('Choose an action...')
    .addOptions(options);

  const close = new ButtonBuilder()
    .setCustomId(`mod_close:${userId}`)
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
    .setCustomId(`mod_back:${userId}`)
    .setLabel('Back')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(back, 'home');
  return new ActionRowBuilder().addComponents(back);
}

function modlogPicker(userId) {
  const menu = new ChannelSelectMenuBuilder()
    .setCustomId(`mod_modlog:${userId}`)
    .setPlaceholder('Select modlog channel...')
    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    .setMinValues(1)
    .setMaxValues(1);
  return [new ActionRowBuilder().addComponents(menu), backRow(userId)];
}

function userPicker(userId, action) {
  const menu = new UserSelectMenuBuilder()
    .setCustomId(`mod_user:${action}:${userId}`)
    .setPlaceholder('Select a member...')
    .setMinValues(1)
    .setMaxValues(1);
  return [new ActionRowBuilder().addComponents(menu), backRow(userId)];
}

function thresholdsModal() {
  return new ModalBuilder()
    .setCustomId('mod_thresholds_modal')
    .setTitle('Auto-warn thresholds')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('mute')
          .setLabel('Mute at (warnings, 0 = off)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(3)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('kick')
          .setLabel('Kick at (warnings, 0 = off)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(3)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('ban')
          .setLabel('Ban at (warnings, 0 = off)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(3)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('duration')
          .setLabel('Auto-mute duration (e.g. 1h)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(10)
      )
    );
}

function caseLookupModal() {
  return new ModalBuilder()
    .setCustomId('mod_case_modal')
    .setTitle('Lookup case')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('case_id')
          .setLabel('Case ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(8)
      )
    );
}

function pickerEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('moderation', title))
    .setDescription(description);
}

function assertOwner(interaction, ownerId) {
  return interaction.user.id === ownerId;
}

function canUseModMenu(member, guildData, ownerIds) {
  return hasLevel(member, 'mod', guildData, ownerIds);
}

function buildWarningsEmbed(member, warns) {
  if (!warns.length) {
    return info(`No warnings for **${member.tag}**.`, `Warnings — ${member.tag}`);
  }
  const list = warns.slice(0, 15).map(formatWarnRow).join('\n\n');
  return info(list, `Warnings — ${member.tag} (${warns.length})`);
}

function buildHistoryEmbed(member, cases) {
  if (!cases.length) {
    return info(`No history for **${member.tag}**.`, `History — ${member.tag}`);
  }
  const list = cases.map(formatCaseRow).join('\n\n');
  return info(list, `History — ${member.tag}`);
}

function buildRecentEmbed(guild, cases) {
  if (!cases.length) {
    return info('No moderation cases recorded yet.', 'Recent cases');
  }
  const list = cases.map(formatCaseRow).join('\n\n');
  return info(list, `Recent cases — ${guild.name}`);
}

function buildCaseLookupEmbed(guild, caseRow) {
  if (!caseRow) {
    return info('Case not found.', 'Case lookup');
  }

  const moderator =
    guild.members.cache.get(caseRow.moderator_id)?.user ||
    { id: caseRow.moderator_id, tag: caseRow.moderator_id, displayAvatarURL: () => null };

  const target = caseRow.user_id
    ? guild.members.cache.get(caseRow.user_id)?.user || {
        id: caseRow.user_id,
        tag: caseRow.user_id,
        displayAvatarURL: () => null,
      }
    : null;

  return buildCaseEmbed({
    caseId: caseRow.id,
    action: caseRow.action,
    moderator,
    target,
    reason: caseRow.reason,
    extra: caseRow.extra,
    createdAt: caseRow.created_at,
  });
}

module.exports = {
  buildModEmbed,
  mainMenu,
  backRow,
  modlogPicker,
  userPicker,
  thresholdsModal,
  caseLookupModal,
  pickerEmbed,
  assertOwner,
  canUseModMenu,
  buildWarningsEmbed,
  buildHistoryEmbed,
  buildRecentEmbed,
  buildCaseLookupEmbed,
  thresholdLine,
};
