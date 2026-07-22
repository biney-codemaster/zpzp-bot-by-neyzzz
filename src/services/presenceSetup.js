const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { color } = require('../utils/embeds');
const { applyComponentEmoji, withEmoji } = require('../utils/emoji');
const {
  STATUS_OPTIONS,
  ACTIVITY_TYPES,
  getPresenceConfig,
} = require('./presence');

function statusLabel(status) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}

function buildPresenceEmbed(client) {
  const cfg = getPresenceConfig(client.db);
  const rows = client.db.listActivities();
  const list = rows.length
    ? rows
        .slice(0, 15)
        .map((r, i) => {
          const on = r.enabled ? 'ON' : 'OFF';
          const url = r.type === 'Streaming' && r.url ? ` · ${r.url}` : '';
          return `\`${i + 1}.\` **#${r.id}** · ${r.type} · \`${r.name}\`${url} · ${on}`;
        })
        .join('\n')
    : '_No activities yet. Add one from the menu._';

  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('admin', 'Bot presence'))
    .setDescription(
      [
        'Configure status and rotating activities.',
        'Activities rotate automatically when more than one is enabled.',
      ].join('\n')
    )
    .addFields(
      {
        name: 'Status',
        value: `\`${statusLabel(cfg.status)}\``,
        inline: true,
      },
      {
        name: 'Rotation',
        value: cfg.rotateEnabled
          ? `\`ON\` · every **${cfg.rotateSeconds}s**`
          : '`OFF` (first enabled activity only)',
        inline: true,
      },
      {
        name: 'Activities',
        value: list.slice(0, 1024),
        inline: false,
      }
    )
    .setFooter({ text: `${rows.length} saved` })
    .setTimestamp();
}

function mainMenu(userId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`presence_menu:${userId}`)
    .setPlaceholder('Choose what to configure...')
    .addOptions(
      {
        label: 'Set status',
        value: 'status',
        description: 'Online / Idle / DND / Invisible',
      },
      {
        label: 'Add activity',
        value: 'add',
        description: 'Add a rotating activity',
      },
      {
        label: 'Toggle activity',
        value: 'toggle',
        description: 'Enable or disable an activity',
      },
      {
        label: 'Remove activity',
        value: 'remove',
        description: 'Delete an activity',
      },
      {
        label: 'Rotation interval',
        value: 'interval',
        description: 'Seconds between activity changes',
      },
      {
        label: 'Toggle rotation',
        value: 'toggle_rotate',
        description: 'Enable or disable rotation',
      },
      {
        label: 'Clear activities',
        value: 'clear',
        description: 'Remove all activities',
      },
      {
        label: 'Apply now',
        value: 'apply',
        description: 'Refresh presence immediately',
      }
    );

  const close = new ButtonBuilder()
    .setCustomId(`presence_close:${userId}`)
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
    .setCustomId(`presence_back:${userId}`)
    .setLabel('Back')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(back, 'home');
  return new ActionRowBuilder().addComponents(back);
}

function statusPicker(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`presence_status:${userId}`)
        .setPlaceholder('Select bot status...')
        .addOptions(STATUS_OPTIONS)
    ),
    backRow(userId),
  ];
}

function activityTypePicker(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`presence_add_type:${userId}`)
        .setPlaceholder('Select activity type...')
        .addOptions(
          ACTIVITY_TYPES.map((t) => ({
            label: t.label,
            value: t.value,
            description:
              t.value === 'Streaming'
                ? 'Requires a Twitch/YouTube URL'
                : `Show as ${t.label}`,
          }))
        )
    ),
    backRow(userId),
  ];
}

function activityPickMenu(userId, rows, action) {
  if (!rows.length) return [backRow(userId)];
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`presence_${action}:${userId}`)
        .setPlaceholder(
          action === 'toggle'
            ? 'Select activity to toggle...'
            : 'Select activity to remove...'
        )
        .addOptions(
          rows.slice(0, 25).map((r) => ({
            label: `#${r.id} ${r.type}`.slice(0, 100),
            value: String(r.id),
            description: `${r.enabled ? 'ON' : 'OFF'} · ${r.name}`.slice(0, 100),
          }))
        )
    ),
    backRow(userId),
  ];
}

function activityNameModal(type) {
  const rows = [
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('activity_name')
        .setLabel(type === 'Custom' ? 'Custom status text' : 'Activity text')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(128)
        .setPlaceholder(
          type === 'Listening' ? 'Spotify' : type === 'Watching' ? '+help' : 'ZPZP'
        )
    ),
  ];

  if (type === 'Streaming') {
    rows.push(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('activity_url')
          .setLabel('Stream URL (Twitch / YouTube)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(200)
          .setPlaceholder('https://twitch.tv/...')
      )
    );
  }

  return new ModalBuilder()
    .setCustomId(`presence_add_modal:${type}`)
    .setTitle(`Add ${type} activity`)
    .addComponents(...rows);
}

function intervalModal(cfg) {
  return new ModalBuilder()
    .setCustomId('presence_interval_modal')
    .setTitle('Rotation interval')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('rotate_seconds')
          .setLabel('Seconds (5–600)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(3)
          .setValue(String(cfg.rotateSeconds || 30))
      )
    );
}

function pickerEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('admin', title))
    .setDescription(description)
    .setTimestamp();
}

function assertOwner(interaction, ownerId) {
  return interaction.user.id === ownerId;
}

module.exports = {
  buildPresenceEmbed,
  mainMenu,
  statusPicker,
  activityTypePicker,
  activityPickMenu,
  activityNameModal,
  intervalModal,
  pickerEmbed,
  assertOwner,
};
