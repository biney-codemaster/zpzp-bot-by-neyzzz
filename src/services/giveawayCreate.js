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
const { parseDuration, formatDuration } = require('../utils/helpers');
const {
  buildGiveawayEmbed,
  buildGiveawayComponents,
  requirementLines,
  normalizeSettings,
} = require('./giveaways');

function draftKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

function ensureDrafts(client) {
  if (!client.giveawayDrafts) client.giveawayDrafts = new Map();
}

function defaultDraft(sourceChannelId) {
  return {
    prize: null,
    duration: null,
    winners: 1,
    channelId: null,
    sourceChannelId,
    requiredRole: null,
    minAccountDays: 0,
    boostersOnly: false,
    bonusRole: null,
    bonusEntries: 0,
    pingOnEnd: false,
  };
}

function getDraft(client, guildId, userId) {
  ensureDrafts(client);
  return client.giveawayDrafts.get(draftKey(guildId, userId));
}

function setDraft(client, guildId, userId, draft) {
  ensureDrafts(client);
  client.giveawayDrafts.set(draftKey(guildId, userId), draft);
}

function clearDraft(client, guildId, userId) {
  ensureDrafts(client);
  client.giveawayDrafts.delete(draftKey(guildId, userId));
}

function draftSettings(draft) {
  return normalizeSettings({
    requiredRole: draft.requiredRole,
    minAccountDays: draft.minAccountDays,
    boostersOnly: draft.boostersOnly,
    bonusRole: draft.bonusRole,
    bonusEntries: draft.bonusEntries,
    pingOnEnd: draft.pingOnEnd,
  });
}

function statusLine(ok, value) {
  return ok ? value : '`Not set`';
}

function onOff(value) {
  return value ? '`ON`' : '`OFF`';
}

function isReady(draft) {
  return Boolean(draft.prize && draft.duration && draft.winners >= 1);
}

function buildCreateEmbed(guild, draft) {
  const settings = draftSettings(draft);
  const required = settings.requiredRole
    ? guild.roles.cache.get(settings.requiredRole)
    : null;
  const bonus = settings.bonusRole
    ? guild.roles.cache.get(settings.bonusRole)
    : null;
  const channel = draft.channelId
    ? guild.channels.cache.get(draft.channelId)
    : guild.channels.cache.get(draft.sourceChannelId);
  const durationMs = draft.duration ? parseDuration(draft.duration) : null;
  const reqLines = requirementLines(settings, guild);

  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('giveaways', 'Create giveaway'))
    .setDescription(
      'Configure everything below, then choose **Post giveaway** from the menu.'
    )
    .addFields(
      {
        name: 'Prize',
        value: statusLine(draft.prize, draft.prize),
        inline: true,
      },
      {
        name: 'Duration',
        value: draft.duration
          ? `\`${draft.duration}\`${durationMs ? ` (${formatDuration(durationMs)})` : ''}`
          : '`Not set`',
        inline: true,
      },
      {
        name: 'Winners',
        value: `\`${draft.winners}\``,
        inline: true,
      },
      {
        name: 'Channel',
        value: channel ? `${channel}` : '`Current channel`',
        inline: true,
      },
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
        name: 'Ping winners',
        value: onOff(settings.pingOnEnd),
        inline: true,
      },
      {
        name: 'Requirements preview',
        value: reqLines.length ? reqLines.join('\n') : 'No extra requirements.',
      },
      {
        name: 'Status',
        value: isReady(draft) ? '`Ready to post`' : '`Missing prize / duration`',
      }
    )
    .setFooter({ text: guild.name })
    .setTimestamp();
}

function mainMenu(userId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`gcreate_menu:${userId}`)
    .setPlaceholder('Configure giveaway...')
    .addOptions(
      { label: 'Prize', value: 'prize', description: 'Set the prize' },
      { label: 'Duration', value: 'duration', description: 'e.g. 1h, 2d' },
      { label: 'Winners', value: 'winners', description: 'Number of winners' },
      { label: 'Channel', value: 'channel', description: 'Where to post' },
      { label: 'Required role', value: 'required_role', description: 'Entry requirement' },
      { label: 'Min account age', value: 'min_age', description: 'Days since account created' },
      { label: 'Boosters only', value: 'boosters', description: 'Toggle boosters-only' },
      { label: 'Bonus role', value: 'bonus_role', description: 'Role for extra entries' },
      { label: 'Bonus entries', value: 'bonus_entries', description: 'Extra entries amount' },
      { label: 'Ping winners', value: 'ping', description: 'Toggle winner ping on end' },
      { label: 'Clear required role', value: 'clear_required' },
      { label: 'Clear bonus role', value: 'clear_bonus' },
      { label: 'Post giveaway', value: 'post', description: 'Publish the giveaway' }
    );

  const close = new ButtonBuilder()
    .setCustomId(`gcreate_close:${userId}`)
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
    .setCustomId(`gcreate_back:${userId}`)
    .setLabel('Back')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(back, 'home');
  return new ActionRowBuilder().addComponents(back);
}

function rolePicker(userId, field) {
  const menu = new RoleSelectMenuBuilder()
    .setCustomId(`gcreate_role:${field}:${userId}`)
    .setPlaceholder('Select a role...')
    .setMinValues(1)
    .setMaxValues(1);
  return [new ActionRowBuilder().addComponents(menu), backRow(userId)];
}

function channelPicker(userId) {
  const menu = new ChannelSelectMenuBuilder()
    .setCustomId(`gcreate_channel:${userId}`)
    .setPlaceholder('Select a channel...')
    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    .setMinValues(1)
    .setMaxValues(1);
  return [new ActionRowBuilder().addComponents(menu), backRow(userId)];
}

function prizeModal(draft) {
  return new ModalBuilder()
    .setCustomId('gcreate_prize_modal')
    .setTitle('Giveaway prize')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('prize')
          .setLabel('Prize')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(256)
          .setValue(draft.prize || '')
      )
    );
}

function durationModal(draft) {
  return new ModalBuilder()
    .setCustomId('gcreate_duration_modal')
    .setTitle('Giveaway duration')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('duration')
          .setLabel('Duration (e.g. 1h, 2d, 30m)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(16)
          .setValue(draft.duration || '')
      )
    );
}

function winnersModal(draft) {
  return new ModalBuilder()
    .setCustomId('gcreate_winners_modal')
    .setTitle('Number of winners')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('winners')
          .setLabel('Winners (1+)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(3)
          .setValue(String(draft.winners || 1))
      )
    );
}

function minAgeModal(draft) {
  return new ModalBuilder()
    .setCustomId('gcreate_min_age_modal')
    .setTitle('Minimum account age')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('days')
          .setLabel('Days (0 = disabled)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(4)
          .setValue(String(draft.minAccountDays || 0))
      )
    );
}

function bonusEntriesModal(draft) {
  return new ModalBuilder()
    .setCustomId('gcreate_bonus_entries_modal')
    .setTitle('Bonus entries')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('amount')
          .setLabel('Extra entries for bonus role (0 = off)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(3)
          .setValue(String(draft.bonusEntries || 0))
      )
    );
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

async function postGiveaway(client, guild, draft, host) {
  if (!isReady(draft)) {
    return { error: 'Set **prize** and **duration** before posting.' };
  }

  const durationMs = parseDuration(draft.duration);
  if (!durationMs) {
    return { error: 'Invalid duration format.' };
  }

  const channelId = draft.channelId || draft.sourceChannelId;
  const channel = guild.channels.cache.get(channelId);
  if (!channel) {
    return { error: 'Target channel not found.' };
  }

  const settings = draftSettings(draft);
  const endsAt = Date.now() + durationMs;
  const giveawayRow = {
    prize: draft.prize,
    winners: draft.winners,
    ends_at: endsAt,
    entries: '{}',
    ended: 0,
    cancelled: 0,
    host_id: host.id,
    ping_on_end: settings.pingOnEnd ? 1 : 0,
    giveaway_settings: JSON.stringify(settings),
  };

  const msg = await channel.send({
    embeds: [buildGiveawayEmbed(giveawayRow, guild, null, host.tag, settings)],
    components: buildGiveawayComponents(),
  });

  client.db.createGiveaway({
    messageId: msg.id,
    channelId: channel.id,
    guildId: guild.id,
    hostId: host.id,
    prize: draft.prize,
    winners: draft.winners,
    endsAt,
    entries: {},
    pingOnEnd: settings.pingOnEnd,
    settings,
  });

  return { channel, message: msg };
}

module.exports = {
  draftKey,
  getDraft,
  setDraft,
  clearDraft,
  defaultDraft,
  draftSettings,
  buildCreateEmbed,
  mainMenu,
  backRow,
  rolePicker,
  channelPicker,
  prizeModal,
  durationModal,
  winnersModal,
  minAgeModal,
  bonusEntriesModal,
  pickerEmbed,
  assertOwner,
  isReady,
  postGiveaway,
};
