const ms = require('ms');

function parseMember(message, arg) {
  if (!arg) return message.mentions.members.first() || null;
  const cleaned = arg.replace(/[<@!>]/g, '');
  return (
    message.mentions.members.first() ||
    message.guild.members.cache.get(cleaned) ||
    message.guild.members.cache.find(
      (m) =>
        m.user.username.toLowerCase() === arg.toLowerCase() ||
        m.displayName.toLowerCase() === arg.toLowerCase()
    ) ||
    null
  );
}

async function fetchMember(message, arg) {
  let member = parseMember(message, arg);
  if (member) return member;
  if (!arg) return null;
  const cleaned = arg.replace(/[<@!>]/g, '');
  try {
    member = await message.guild.members.fetch(cleaned);
    return member;
  } catch {
    return null;
  }
}

function parseChannel(message, arg) {
  if (!arg) return message.mentions.channels.first() || null;
  const cleaned = arg.replace(/[<#>]/g, '');
  return (
    message.mentions.channels.first() ||
    message.guild.channels.cache.get(cleaned) ||
    message.guild.channels.cache.find((c) => c.name === arg.replace(/^#/, '')) ||
    null
  );
}

function parseRole(message, arg) {
  if (!arg) return message.mentions.roles.first() || null;
  const cleaned = arg.replace(/[<@&>]/g, '');
  return (
    message.mentions.roles.first() ||
    message.guild.roles.cache.get(cleaned) ||
    message.guild.roles.cache.find((r) => r.name.toLowerCase() === arg.toLowerCase()) ||
    null
  );
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function formatNumber(n) {
  return Number(n).toLocaleString('fr-FR');
}

function xpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

function formatDuration(msValue) {
  const sec = Math.floor(msValue / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (d) parts.push(`${d}j`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || !parts.length) parts.push(`${s}s`);
  return parts.join(' ');
}

function parseDuration(input) {
  if (!input) return null;
  const value = ms(input);
  return typeof value === 'number' && value > 0 ? value : null;
}

function progressBar(current, max, size = 10) {
  const ratio = Math.max(0, Math.min(1, current / Math.max(max, 1)));
  const filled = Math.round(ratio * size);
  return '█'.repeat(filled) + '░'.repeat(size - filled);
}

function canModerate(moderator, target) {
  if (!target) return false;
  if (target.id === moderator.id) return false;
  if (target.id === moderator.guild.ownerId) return false;
  if (moderator.id === moderator.guild.ownerId) return true;
  return moderator.roles.highest.position > target.roles.highest.position;
}

function replacePlaceholders(text, { user, guild, memberCount }) {
  return text
    .replaceAll('{user}', `${user}`)
    .replaceAll('{user.name}', user.username)
    .replaceAll('{user.tag}', user.tag || user.username)
    .replaceAll('{user.id}', user.id)
    .replaceAll('{server}', guild.name)
    .replaceAll('{server.id}', guild.id)
    .replaceAll('{count}', String(memberCount ?? guild.memberCount));
}

module.exports = {
  parseMember,
  fetchMember,
  parseChannel,
  parseRole,
  randomInt,
  pick,
  formatNumber,
  xpForLevel,
  formatDuration,
  parseDuration,
  progressBar,
  canModerate,
  replacePlaceholders,
};
