require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  prefix: process.env.PREFIX || '+',
  embedColor: process.env.EMBED_COLOR || '5865F2',
  ownerIds: (process.env.OWNER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
  dbPath: process.env.DB_PATH || './data/bot.db',
  economy: {
    currency: '🪙',
    currencyName: 'pièces',
    startBalance: 200,
    dailyMin: 150,
    dailyMax: 400,
    workMin: 50,
    workMax: 200,
    crimeMin: 100,
    crimeMax: 500,
    crimeFailFine: 150,
  },
  levels: {
    xpMin: 15,
    xpMax: 25,
    cooldownMs: 60_000,
  },
  shop: [
    { id: 'cookie', name: 'Cookie', price: 50, description: 'Un cookie croustillant.' },
    { id: 'coffee', name: 'Café', price: 100, description: 'Pour rester productif.' },
    { id: 'rose', name: 'Rose', price: 250, description: 'Offre-la à quelqu\'un.' },
    { id: 'ring', name: 'Bague', price: 2500, description: 'Une bague élégante.' },
    { id: 'crown', name: 'Couronne', price: 10000, description: 'Pour les vrais riches.' },
    { id: 'laptop', name: 'PC Gamer', price: 5000, description: 'Pour farmer encore plus.' },
  ],
};
