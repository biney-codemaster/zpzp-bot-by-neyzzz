const { ActivityType } = require('discord.js');

const STATUS_OPTIONS = [
  { label: 'Online', value: 'online', description: 'Green — Online' },
  { label: 'Idle', value: 'idle', description: 'Yellow — Idle' },
  { label: 'Do Not Disturb', value: 'dnd', description: 'Red — DND' },
  { label: 'Invisible', value: 'invisible', description: 'Appear offline' },
];

const ACTIVITY_TYPES = [
  { label: 'Playing', value: 'Playing', type: ActivityType.Playing },
  { label: 'Watching', value: 'Watching', type: ActivityType.Watching },
  { label: 'Listening', value: 'Listening', type: ActivityType.Listening },
  { label: 'Competing', value: 'Competing', type: ActivityType.Competing },
  { label: 'Streaming', value: 'Streaming', type: ActivityType.Streaming },
  { label: 'Custom', value: 'Custom', type: ActivityType.Custom },
];

const DEFAULT_STATUS = 'online';
const DEFAULT_ROTATE_SECONDS = 30;

function activityTypeEnum(name) {
  return ACTIVITY_TYPES.find((t) => t.value === name)?.type ?? ActivityType.Watching;
}

function activityTypeLabel(type) {
  return ACTIVITY_TYPES.find((t) => t.type === type)?.label || 'Watching';
}

function getPresenceConfig(db) {
  return {
    status: db.getBotSetting('presence_status') || DEFAULT_STATUS,
    rotateSeconds: Math.max(
      5,
      Number(db.getBotSetting('presence_rotate_seconds')) || DEFAULT_ROTATE_SECONDS
    ),
    rotateEnabled: (db.getBotSetting('presence_rotate') ?? '1') !== '0',
  };
}

function buildActivityPayload(row) {
  if (!row) return null;
  const type = activityTypeEnum(row.type);

  if (type === ActivityType.Custom) {
    return {
      name: 'Custom Status',
      type,
      state: row.name,
    };
  }

  const payload = {
    name: row.name,
    type,
  };

  if (type === ActivityType.Streaming && row.url) {
    payload.url = row.url;
  }

  return payload;
}

function applyPresence(client, activityRow = null) {
  const cfg = getPresenceConfig(client.db);
  const activities = [];
  const payload = buildActivityPayload(activityRow);
  if (payload) activities.push(payload);

  return client.user.setPresence({
    status: cfg.status,
    activities,
  });
}

function startPresenceRotation(client) {
  if (client.presenceTimer) {
    clearInterval(client.presenceTimer);
    client.presenceTimer = null;
  }

  const tick = () => {
    try {
      const cfg = getPresenceConfig(client.db);
      const rows = client.db.listActivities({ enabledOnly: true });

      if (!rows.length) {
        applyPresence(client, {
          type: 'Watching',
          name: `${client.db.getPrefix?.(null) || client.config.prefix || '+'}help`,
          url: null,
        });
        return;
      }

      if (!cfg.rotateEnabled || rows.length === 1) {
        applyPresence(client, rows[0]);
        client.presenceIndex = 0;
        return;
      }

      const index = client.presenceIndex || 0;
      applyPresence(client, rows[index % rows.length]);
      client.presenceIndex = (index + 1) % rows.length;
    } catch (err) {
      console.error('[presence]', err);
    }
  };

  tick();
  const cfg = getPresenceConfig(client.db);
  const ms = Math.max(5, cfg.rotateSeconds) * 1000;
  client.presenceTimer = setInterval(tick, ms);
}

function refreshPresenceRotation(client) {
  startPresenceRotation(client);
}

module.exports = {
  STATUS_OPTIONS,
  ACTIVITY_TYPES,
  DEFAULT_STATUS,
  DEFAULT_ROTATE_SECONDS,
  activityTypeEnum,
  activityTypeLabel,
  getPresenceConfig,
  buildActivityPayload,
  applyPresence,
  startPresenceRotation,
  refreshPresenceRotation,
};
