const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require('discord.js');
const config = require('./config');
const Database = require('./src/database/Database');
const { loadCommands } = require('./src/handlers/commandHandler');
const { loadEvents } = require('./src/handlers/eventHandler');

if (!config.token) {
  console.error('❌ DISCORD_TOKEN manquant. Copie .env.example → .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.User,
  ],
});

client.config = config;
client.db = new Database(config.dbPath);
client.commands = new Collection();
client.aliases = new Collection();
client.cooldowns = new Collection();
client.snipes = new Map();
client.spamMap = new Map();

loadCommands(client);
loadEvents(client);

process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

client.login(config.token).catch((err) => {
  console.error('❌ Connexion impossible:', err.message);
  process.exit(1);
});
