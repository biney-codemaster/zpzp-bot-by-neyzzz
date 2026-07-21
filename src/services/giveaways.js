const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const { color } = require('../utils/embeds');
const { applyComponentEmoji, withEmoji } = require('../utils/emoji');
const { formatDuration } = require('../utils/helpers');

function parseEntryMap(raw) {
  try {
    const parsed = JSON.parse(raw || '{}');
    if (Array.isArray(parsed)) {
      const map = {};
      for (const id of parsed) map[id] = 1;
      return map;
    }
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    /* ignore */
  }
  return {};
}

function serializeEntryMap(map) {
  return JSON.stringify(map || {});
}

function entryStats(map) {
  const entries = Object.values(map).reduce((sum, n) => sum + Number(n || 0), 0);
  const participants = Object.keys(map).length;
  return { entries, participants };
}

function expandEntryPool(map) {
  const pool = [];
  for (const [userId, count] of Object.entries(map)) {
    const n = Math.max(0, Number(count) || 0);
    for (let i = 0; i < n; i += 1) pool.push(userId);
  }
  return pool;
}

function pickWinners(map, count) {
  const pool = expandEntryPool(map);
  const winnerCount = Math.min(count, pool.length);
  const winners = [];
  const working = [...pool];

  for (let i = 0; i < winnerCount; i += 1) {
    const idx = Math.floor(Math.random() * working.length);
    winners.push(working.splice(idx, 1)[0]);
  }

  return [...new Set(winners)];
}

function normalizeSettings(raw = {}) {
  return {
    requiredRole: raw.requiredRole || null,
    minAccountDays: raw.minAccountDays || 0,
    boostersOnly: Boolean(raw.boostersOnly),
    bonusRole: raw.bonusRole || null,
    bonusEntries: raw.bonusEntries || 0,
    pingOnEnd: Boolean(raw.pingOnEnd),
  };
}

function parseGiveawaySettings(raw) {
  if (!raw) return null;
  try {
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

function getGiveawaySettings(guildData, giveaway = null) {
  const fromGiveaway = giveaway ? parseGiveawaySettings(giveaway.giveaway_settings) : null;
  if (fromGiveaway) return fromGiveaway;

  if (!guildData) return normalizeSettings({});
  return normalizeSettings({
    requiredRole: guildData.giveaway_required_role,
    minAccountDays: guildData.giveaway_min_account_days,
    boostersOnly: guildData.giveaway_boosters_only,
    bonusRole: guildData.giveaway_bonus_role,
    bonusEntries: guildData.giveaway_bonus_entries,
    pingOnEnd: guildData.giveaway_ping_on_end,
  });
}

function requirementLines(settings, guild) {
  const lines = [];
  if (settings.requiredRole) {
    const role = guild.roles.cache.get(settings.requiredRole);
    lines.push(`Required role: ${role || `\`${settings.requiredRole}\``}`);
  }
  if (settings.minAccountDays > 0) {
    lines.push(`Account age: **${settings.minAccountDays}** day(s)+`);
  }
  if (settings.boostersOnly) {
    lines.push('Server boosters only');
  }
  if (settings.bonusRole && settings.bonusEntries > 0) {
    const role = guild.roles.cache.get(settings.bonusRole);
    lines.push(
      `Bonus entries: **+${settings.bonusEntries}** for ${role || 'configured role'}`
    );
  }
  return lines;
}

function checkEligibility(member, settings) {
  if (!member) return 'Could not verify your membership.';

  if (settings.boostersOnly && !member.premiumSinceTimestamp) {
    return 'Only server boosters can enter this giveaway.';
  }

  if (settings.requiredRole && !member.roles.cache.has(settings.requiredRole)) {
    return 'You do not have the required role to enter.';
  }

  if (settings.minAccountDays > 0) {
    const ageDays =
      (Date.now() - member.user.createdTimestamp) / (24 * 60 * 60 * 1000);
    if (ageDays < settings.minAccountDays) {
      return `Your account must be at least **${settings.minAccountDays}** day(s) old.`;
    }
  }

  return null;
}

function entryWeight(member, settings) {
  let weight = 1;
  if (
    settings.bonusRole &&
    settings.bonusEntries > 0 &&
    member.roles.cache.has(settings.bonusRole)
  ) {
    weight += settings.bonusEntries;
  }
  return weight;
}

function buildGiveawayEmbed(giveaway, guild, guildData, hostTag, settingsOverride = null) {
  const map = parseEntryMap(giveaway.entries);
  const { entries, participants } = entryStats(map);
  const settings =
    settingsOverride || getGiveawaySettings(guildData, giveaway);

  const lines = [
    `**Prize:** ${giveaway.prize}`,
    `**Winners:** ${giveaway.winners}`,
    `**Ends:** <t:${Math.floor(giveaway.ends_at / 1000)}:R> (<t:${Math.floor(giveaway.ends_at / 1000)}:f>)`,
    `**Entries:** ${entries} (${participants} participant${participants === 1 ? '' : 's'})`,
  ];

  const reqs = requirementLines(settings, guild);
  if (reqs.length) {
    lines.push('', '**Requirements**', ...reqs);
  }

  if (!giveaway.ended && !giveaway.cancelled) {
    lines.push('', 'Click **Enter** to join or **Leave** to withdraw.');
  }

  let title = withEmoji('giveaways', 'Giveaway');
  if (giveaway.cancelled) title = withEmoji('giveaways', 'Giveaway cancelled');
  else if (giveaway.ended) title = withEmoji('giveaways', 'Giveaway ended');

  const footer = hostTag
    ? `Hosted by ${hostTag}`
    : `Hosted by ${giveaway.host_id}`;

  return new EmbedBuilder()
    .setColor(color())
    .setTitle(title)
    .setDescription(lines.join('\n'))
    .setFooter({ text: footer })
    .setTimestamp(giveaway.ends_at);
}

function buildGiveawayComponents(ended = false, cancelled = false) {
  if (ended || cancelled) return [];

  const enter = new ButtonBuilder()
    .setCustomId('giveaway_enter')
    .setLabel('Enter')
    .setStyle(ButtonStyle.Primary);
  applyComponentEmoji(enter, 'enter');

  const leave = new ButtonBuilder()
    .setCustomId('giveaway_leave')
    .setLabel('Leave')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(leave, 'close');

  return [new ActionRowBuilder().addComponents(enter, leave)];
}

async function refreshGiveawayMessage(client, messageId) {
  const giveaway = client.db.getGiveaway(messageId);
  if (!giveaway || giveaway.ended || giveaway.cancelled) return;

  const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
  if (!channel) return;

  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) return;

  const host = await client.users.fetch(giveaway.host_id).catch(() => null);
  const guild = await client.guilds.fetch(giveaway.guild_id).catch(() => null);
  const guildData = client.db.ensureGuild(giveaway.guild_id);
  const settings = getGiveawaySettings(guildData, giveaway);

  await message
    .edit({
      embeds: [
        buildGiveawayEmbed(giveaway, guild, guildData, host?.tag, settings),
      ],
      components: buildGiveawayComponents(false, false),
    })
    .catch(() => null);
}

async function endGiveaway(client, messageId, { ping = null } = {}) {
  const giveaway = client.db.getGiveaway(messageId);
  if (!giveaway || giveaway.ended || giveaway.cancelled) return null;

  const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
  if (!channel) return null;

  const message = await channel.messages.fetch(messageId).catch(() => null);
  const map = parseEntryMap(giveaway.entries);
  const { entries, participants } = entryStats(map);
  const winners = pickWinners(map, giveaway.winners);

  client.db.updateGiveaway(messageId, {
    ended: 1,
    winner_ids: JSON.stringify(winners),
  });

  const host = await client.users.fetch(giveaway.host_id).catch(() => null);
  const guildData = client.db.ensureGuild(giveaway.guild_id);
  const settings = getGiveawaySettings(guildData, giveaway);
  const shouldPing =
    ping !== null ? ping : Boolean(giveaway.ping_on_end ?? settings.pingOnEnd);

  const endedEmbed = new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('giveaways', 'Giveaway ended'))
    .setDescription(
      [
        `**Prize:** ${giveaway.prize}`,
        `**Winner(s):** ${
          winners.length
            ? winners.map((id) => `<@${id}>`).join(', ')
            : 'Nobody (no entries)'
        }`,
        `**Entries:** ${entries} (${participants} participant${participants === 1 ? '' : 's'})`,
      ].join('\n')
    )
    .setFooter({ text: `Hosted by ${host?.tag || giveaway.host_id}` })
    .setTimestamp();

  if (message) {
    await message.edit({ embeds: [endedEmbed], components: [] }).catch(() => null);
  }

  if (winners.length) {
    const content = shouldPing
      ? `Congratulations ${winners.map((id) => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**.`
      : `Giveaway ended — winner(s) for **${giveaway.prize}**: ${winners.map((id) => `<@${id}>`).join(', ')}`;

    await channel
      .send({
        content,
        allowedMentions: shouldPing
          ? { users: winners, roles: [], parse: [] }
          : { parse: [] },
      })
      .catch(() => null);
  } else {
    await channel
      .send(`Giveaway **${giveaway.prize}** ended with no entries.`)
      .catch(() => null);
  }

  return { winners, entries, participants };
}

async function cancelGiveaway(client, messageId) {
  const giveaway = client.db.getGiveaway(messageId);
  if (!giveaway || giveaway.ended || giveaway.cancelled) return false;

  client.db.updateGiveaway(messageId, { cancelled: 1, ended: 1 });

  const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
  if (!channel) return true;

  const message = await channel.messages.fetch(messageId).catch(() => null);
  const host = await client.users.fetch(giveaway.host_id).catch(() => null);

  const embed = new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('giveaways', 'Giveaway cancelled'))
    .setDescription(
      [
        `**Prize:** ${giveaway.prize}`,
        'This giveaway was cancelled. No winners were drawn.',
      ].join('\n')
    )
    .setFooter({ text: `Hosted by ${host?.tag || giveaway.host_id}` })
    .setTimestamp();

  if (message) {
    await message.edit({ embeds: [embed], components: [] }).catch(() => null);
  }

  await channel
    .send(`Giveaway **${giveaway.prize}** was cancelled.`)
    .catch(() => null);

  return true;
}

async function rerollGiveaway(client, messageId, count = 1) {
  const giveaway = client.db.getGiveaway(messageId);
  if (!giveaway) return null;

  const map = parseEntryMap(giveaway.entries);
  const pool = expandEntryPool(map);
  if (!pool.length) return { error: 'No entries.' };

  const winners = pickWinners(map, Math.max(1, count));
  return { winners, prize: giveaway.prize, giveaway };
}

module.exports = {
  parseEntryMap,
  serializeEntryMap,
  entryStats,
  expandEntryPool,
  pickWinners,
  normalizeSettings,
  parseGiveawaySettings,
  getGiveawaySettings,
  requirementLines,
  checkEligibility,
  entryWeight,
  buildGiveawayEmbed,
  buildGiveawayComponents,
  refreshGiveawayMessage,
  endGiveaway,
  cancelGiveaway,
  rerollGiveaway,
};
