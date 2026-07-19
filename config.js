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
};
