require('dotenv').config();

const rootOwnerIds = (process.env.OWNER_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

module.exports = {
  token: process.env.DISCORD_TOKEN,
  prefix: process.env.PREFIX || '+',
  embedColor: (process.env.EMBED_COLOR || 'FFFFFF').replace('#', ''),
  /** Permanent owners from env — cannot be removed via commands */
  rootOwnerIds,
  /** Effective owners (root + DB). Refreshed at runtime by owners service. */
  ownerIds: [...rootOwnerIds],
  dbPath: process.env.DB_PATH || './data/bot.db',
  tickets: {
    /** Cooldown between opening tickets (ms) */
    openCooldownMs: 60_000,
    /** Delay before channel deletion after close (ms) */
    deleteDelayMs: 5_000,
  },
};
