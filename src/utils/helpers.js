const ms = require('ms');

async function fetchMember(message, arg) {
  if (!arg && message.mentions.members.size) {
    return message.mentions.members.first();
  }
  if (!arg) return null;

  const cleaned = arg.replace(/[<@!>]/g, '');
  const cached =
    message.mentions.members.first() ||
    message.guild.members.cache.get(cleaned) ||
    message.guild.members.cache.find(
      (m) =>
        m.user.username.toLowerCase() === arg.toLowerCase() ||
        m.displayName.toLowerCase() === arg.toLowerCase()
    );

  if (cached) return cached;
  try {
    return await message.guild.members.fetch(cleaned);
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
    message.guild.roles.cache.find(
      (r) => r.name.toLowerCase() === arg.toLowerCase()
    ) ||
    null
  );
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
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

function canModerate(moderator, target) {
  if (!target) return false;
  if (target.id === moderator.id) return false;
  if (target.id === moderator.guild.ownerId) return false;
  if (target.user?.bot && target.id === moderator.client.user.id) return false;
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
  fetchMember,
  parseChannel,
  parseRole,
  randomInt,
  pick,
  formatDuration,
  parseDuration,
  canModerate,
  replacePlaceholders,
};
