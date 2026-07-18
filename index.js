const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  ActivityType,
} = require('discord.js');
const config = require('./config');
const BotDatabase = require('./src/database/database');
const { loadCommands } = require('./src/handlers/commandHandler');
const { loadEvents } = require('./src/handlers/eventHandler');

if (!config.token) {
  console.error('❌ DISCORD_TOKEN manquant. Copie .env.example vers .env et renseigne le token.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.User,
  ],
});

client.commands = new Collection();
client.aliases = new Collection();
client.cooldowns = new Collection();
client.config = config;
client.db = new BotDatabase();
client.spamMap = new Map();

loadCommands(client);
loadEvents(client);

process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

client.login(config.token).catch((err) => {
  console.error('❌ Connexion Discord impossible:', err.message);
  process.exit(1);
});

module.exports = client;
