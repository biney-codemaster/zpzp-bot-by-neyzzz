require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  prefix: process.env.PREFIX || '+',
  embedColor: (process.env.EMBED_COLOR || 'FFFFFF').replace('#', ''),
  ownerIds: (process.env.OWNER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
  dbPath: process.env.DB_PATH || './data/bot.db',
  tickets: {
    /** Cooldown between opening tickets (ms) */
    openCooldownMs: 60_000,
    /** Delay before channel deletion after close (ms) */
    deleteDelayMs: 5_000,
  },
  moderation: {
    /** Default warn count before auto-mute (0 = disabled) */
    defaultWarnMute: 3,
    /** Default warn count before auto-kick (0 = disabled) */
    defaultWarnKick: 5,
    /** Default warn count before auto-ban (0 = disabled) */
    defaultWarnBan: 7,
    /** Duration for auto-mute sanctions */
    autoMuteDuration: '1h',
  },
};
