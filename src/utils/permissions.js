/** @typedef {'user'|'mod'|'owner'} PermLevel */

const LEVELS = {
  user: 1,
  mod: 2,
  owner: 3,
};

/**
 * Resolve a member's custom permission level.
 * - owner: bot owners (OWNER_IDS + DB owners)
 * - mod: configured mod role
 * - user: everyone else
 *
 * Discord Administrator / guild owner no longer grant bot admin access.
 */
function getMemberLevel(member, guildData, ownerIds = []) {
  if (!member) return LEVELS.user;
  if (ownerIds.includes(member.id)) return LEVELS.owner;

  if (guildData?.mod_role && member.roles.cache.has(guildData.mod_role)) {
    return LEVELS.mod;
  }

  return LEVELS.user;
}

function hasLevel(member, required, guildData, ownerIds = []) {
  // Legacy: treat old "admin" requirement as owner
  const key = required === 'admin' ? 'owner' : required;
  const need = LEVELS[key] ?? LEVELS.user;
  return getMemberLevel(member, guildData, ownerIds) >= need;
}

function levelName(level) {
  return Object.entries(LEVELS).find(([, v]) => v === level)?.[0] || 'user';
}

module.exports = {
  LEVELS,
  getMemberLevel,
  hasLevel,
  levelName,
};
