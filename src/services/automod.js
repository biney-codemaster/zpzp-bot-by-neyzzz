const { PermissionFlagsBits } = require('discord.js');
const { error } = require('../utils/embeds');
const { hasLevel } = require('../utils/permissions');
const { sendModLog } = require('../utils/modlog');
const { parseJsonArray } = require('./configDefaults');

const LINK_REGEX = /https?:\/\/|discord\.gg\/|discord\.com\/invite\//i;

function isIgnored(message, guildData) {
  const ignoreChannels = parseJsonArray(guildData.automod_ignore_channels);
  if (ignoreChannels.includes(message.channel.id)) return true;

  const ignoreRoles = parseJsonArray(guildData.automod_ignore_roles);
  if (
    ignoreRoles.length &&
    message.member?.roles?.cache?.some((role) => ignoreRoles.includes(role.id))
  ) {
    return true;
  }

  return false;
}

async function applyPunishment(client, message, {
  filter,
  action,
  reason,
  deleteMessage = true,
}) {
  const guildData = client.db.ensureGuild(message.guild.id);
  const timeoutMs = Math.max(
    5,
    Math.min(600, Number(guildData.automod_timeout_seconds) || 30)
  ) * 1000;

  if (deleteMessage) {
    await message.delete().catch(() => null);
  }

  let detail = `Filter: ${filter}`;

  if (action === 'warn') {
    client.db.addWarning(
      message.guild.id,
      message.author.id,
      client.user.id,
      reason
    );
    detail += ' · Punishment: warn';
    const warn = await message.channel
      .send({ embeds: [error(`${message.author}, ${reason}`)] })
      .catch(() => null);
    if (warn) setTimeout(() => warn.delete().catch(() => null), 5000);
  } else if (action === 'timeout') {
    await message.member
      ?.timeout(timeoutMs, reason)
      .catch(() => null);
    detail += ` · Punishment: timeout ${timeoutMs / 1000}s`;
    const warn = await message.channel
      .send({
        embeds: [
          error(
            `${message.author} timed out for ${timeoutMs / 1000}s (${filter}).`
          ),
        ],
      })
      .catch(() => null);
    if (warn) setTimeout(() => warn.delete().catch(() => null), 5000);
  } else {
    detail += ' · Punishment: delete';
    const warn = await message.channel
      .send({ embeds: [error(`${message.author}, ${reason}`)] })
      .catch(() => null);
    if (warn) setTimeout(() => warn.delete().catch(() => null), 5000);
  }

  if (guildData.automod_log) {
    await sendModLog(client, message.guild, {
      action: `Automod · ${filter}`,
      moderator: client.user,
      target: message.author,
      reason,
      extra: `${detail} · Channel: #${message.channel.name}`,
    });
  }
}

async function runAutomod(client, message) {
  if (!message.guild || message.author.bot) return false;

  const guildData = client.db.ensureGuild(message.guild.id);
  if (hasLevel(message.member, 'mod', guildData, client.config.ownerIds)) {
    return false;
  }
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return false;
  }
  if (isIgnored(message, guildData)) {
    return false;
  }

  if (guildData.automod_antilink && LINK_REGEX.test(message.content)) {
    await applyPunishment(client, message, {
      filter: 'antilink',
      action: guildData.automod_antilink_action || 'delete',
      reason: 'Links are not allowed here.',
    });
    return true;
  }

  if (guildData.automod_badwords) {
    const words = parseJsonArray(guildData.badwords);
    const content = message.content.toLowerCase();
    if (words.some((w) => w && content.includes(String(w).toLowerCase()))) {
      await applyPunishment(client, message, {
        filter: 'badwords',
        action: guildData.automod_badwords_action || 'delete',
        reason: 'Banned word detected.',
      });
      return true;
    }
  }

  if (guildData.automod_antispam) {
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const data = client.spamMap.get(key) || { count: 0, last: now };
    data.count = now - data.last < 5000 ? data.count + 1 : 1;
    data.last = now;
    client.spamMap.set(key, data);

    if (data.count >= 6) {
      client.spamMap.set(key, { count: 0, last: now });
      const action = guildData.automod_antispam_action || 'timeout';
      await applyPunishment(client, message, {
        filter: 'antispam',
        action: action === 'delete' ? 'timeout' : action,
        reason: 'Spam detected.',
        deleteMessage: false,
      });
      return true;
    }
  }

  return false;
}

module.exports = { runAutomod };
