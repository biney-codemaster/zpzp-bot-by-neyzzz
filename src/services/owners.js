/**
 * Bot owners = env OWNER_IDS (root, cannot be removed) + DB owners.
 */

function getRootOwnerIds(client) {
  return [...(client.config.rootOwnerIds || [])];
}

function refreshOwnerIds(client) {
  const root = getRootOwnerIds(client);
  const extra = client.db.listOwners().map((row) => row.id);
  client.config.ownerIds = [...new Set([...root, ...extra])];
  return client.config.ownerIds;
}

function isOwner(client, userId) {
  return client.config.ownerIds.includes(userId);
}

function isRootOwner(client, userId) {
  return getRootOwnerIds(client).includes(userId);
}

function addOwner(client, userId, addedBy) {
  if (isOwner(client, userId)) {
    return { ok: false, message: 'That user is already an owner.' };
  }
  client.db.addOwner(userId, addedBy);
  refreshOwnerIds(client);
  return { ok: true };
}

function removeOwner(client, userId) {
  if (isRootOwner(client, userId)) {
    return {
      ok: false,
      message: 'Cannot remove a root owner from `OWNER_IDS` in the environment.',
    };
  }
  if (!isOwner(client, userId)) {
    return { ok: false, message: 'That user is not an owner.' };
  }
  client.db.removeOwner(userId);
  refreshOwnerIds(client);
  return { ok: true };
}

function listOwnersDetailed(client) {
  const root = new Set(getRootOwnerIds(client));
  const dbRows = client.db.listOwners();
  const dbMap = new Map(dbRows.map((r) => [r.id, r]));

  return client.config.ownerIds.map((id) => ({
    id,
    root: root.has(id),
    addedBy: dbMap.get(id)?.added_by || null,
    addedAt: dbMap.get(id)?.added_at || null,
  }));
}

module.exports = {
  refreshOwnerIds,
  isOwner,
  isRootOwner,
  addOwner,
  removeOwner,
  listOwnersDetailed,
  getRootOwnerIds,
};
