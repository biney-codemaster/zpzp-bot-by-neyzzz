const { PermissionFlagsBits } = require('discord.js');
const { parseDuration, formatDuration } = require('../utils/helpers');
const { sendModLog } = require('../utils/modlog');

function markManualUnmute(client, guildId, userId) {
  if (!client.manualUnmutes) client.manualUnmutes = new Map();
  const key = `${guildId}:${userId}`;
  client.manualUnmutes.set(key, Date.now());
  setTimeout(() => client.manualUnmutes.delete(key), 15_000);
}

function wasManualUnmute(client, guildId, userId) {
  return client.manualUnmutes?.has(`${guildId}:${userId}`);
}

async function dmSanction(user, guild, { action, reason, caseId, extra }) {
  const lines = [
    `You received a moderation action in **${guild.name}**.`,
    `**Action:** ${action}`,
    `**Reason:** ${reason || 'No reason provided'}`,
  ];
  if (caseId) lines.push(`**Case:** #${caseId}`);
  if (extra) lines.push(`**Details:** ${extra}`);
  await user.send(lines.join('\n')).catch(() => null);
}

async function applyAutoWarnSanctions(client, guild, member, moderator, warnCount) {
  const thresholds = client.db.getWarnThresholds(guild.id);
  const results = [];

  if (thresholds.ban > 0 && warnCount === thresholds.ban) {
    if (member.bannable) {
      const reason = `Auto-ban (${warnCount} warnings)`;
      await member.ban({ reason: `Auto-warn: ${reason}` });
      const caseId = await sendModLog(client, guild, {
        action: 'Auto-Ban',
        moderator,
        target: member.user,
        reason,
        extra: `Triggered at ${warnCount} warnings`,
      });
      await dmSanction(member.user, guild, {
        action: 'Auto-Ban',
        reason,
        caseId,
        extra: `${warnCount} warnings reached`,
      });
      results.push(`auto-ban (#${caseId})`);
    }
    return results;
  }

  if (thresholds.kick > 0 && warnCount === thresholds.kick) {
    if (member.kickable) {
      const reason = `Auto-kick (${warnCount} warnings)`;
      await member.kick(`Auto-warn: ${reason}`);
      const caseId = await sendModLog(client, guild, {
        action: 'Auto-Kick',
        moderator,
        target: member.user,
        reason,
        extra: `Triggered at ${warnCount} warnings`,
      });
      await dmSanction(member.user, guild, {
        action: 'Auto-Kick',
        reason,
        caseId,
        extra: `${warnCount} warnings reached`,
      });
      results.push(`auto-kick (#${caseId})`);
    }
    return results;
  }

  if (thresholds.mute > 0 && warnCount === thresholds.mute) {
    const durationMs = parseDuration(thresholds.muteDuration);
    if (durationMs && member.moderatable) {
      const reason = `Auto-mute (${warnCount} warnings)`;
      await member.timeout(durationMs, `Auto-warn: ${reason}`);
      const durationText = formatDuration(durationMs);
      const caseId = await sendModLog(client, guild, {
        action: 'Auto-Mute',
        moderator,
        target: member.user,
        reason,
        duration: durationText,
        extra: `Triggered at ${warnCount} warnings`,
      });
      await dmSanction(member.user, guild, {
        action: 'Auto-Mute',
        reason,
        caseId,
        extra: `Duration: ${durationText}`,
      });
      results.push(`auto-mute ${durationText} (#${caseId})`);
    }
  }

  return results;
}

function assertModStaff(member, guildData, ownerIds) {
  const { hasLevel } = require('../utils/permissions');
  return hasLevel(member, 'mod', guildData, ownerIds);
}

function assertModAdmin(member, guildData, ownerIds) {
  const { hasLevel } = require('../utils/permissions');
  return hasLevel(member, 'admin', guildData, ownerIds);
}

function botCanModerate(guild) {
  const me = guild.members.me;
  return {
    ban: me?.permissions.has(PermissionFlagsBits.BanMembers),
    kick: me?.permissions.has(PermissionFlagsBits.KickMembers),
    mute: me?.permissions.has(PermissionFlagsBits.ModerateMembers),
  };
}

module.exports = {
  dmSanction,
  applyAutoWarnSanctions,
  markManualUnmute,
  wasManualUnmute,
  assertModStaff,
  assertModAdmin,
  botCanModerate,
};
