const { PermissionFlagsBits } = require('discord.js');

/** @typedef {'user'|'mod'|'admin'|'owner'} PermLevel */

const LEVELS = {
  user: 1,
  mod: 2,
  admin: 3,
  owner: 4,
};

/**
 * Calcule le niveau de permission custom du membre.
 * Bootstrap: Admin Discord / propriétaire serveur = admin bot
 * jusqu'à ce que les rôles custom soient configurés.
 */
function getMemberLevel(member, guildData, ownerIds = []) {
  if (!member) return LEVELS.user;
  if (ownerIds.includes(member.id)) return LEVELS.owner;
  if (member.id === member.guild.ownerId) return LEVELS.admin;

  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return LEVELS.admin;
  }

  if (guildData?.admin_role && member.roles.cache.has(guildData.admin_role)) {
    return LEVELS.admin;
  }

  if (guildData?.mod_role && member.roles.cache.has(guildData.mod_role)) {
    return LEVELS.mod;
  }

  return LEVELS.user;
}

function hasLevel(member, required, guildData, ownerIds = []) {
  const need = LEVELS[required] ?? LEVELS.user;
  return getMemberLevel(member, guildData, ownerIds) >= need;
}

function levelName(level) {
  return (
    Object.entries(LEVELS).find(([, v]) => v === level)?.[0] || 'user'
  );
}

module.exports = {
  LEVELS,
  getMemberLevel,
  hasLevel,
  levelName,
};
