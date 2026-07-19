const { ChannelType } = require('discord.js');
const { error, info } = require('../utils/embeds');
const { formatDuration } = require('../utils/helpers');
const { hasLevel } = require('../utils/permissions');
const { runAutomod } = require('../services/automod');

async function handleAfk(client, message) {
  const self = client.db.getAfk(message.guild.id, message.author.id);
  if (self) {
    client.db.removeAfk(message.guild.id, message.author.id);
    message.channel
      .send({
        embeds: [
          info(
            `Welcome back ${message.author}. AFK removed (was away ${formatDuration(Date.now() - self.since)}).`
          ),
        ],
      })
      .then((m) => setTimeout(() => m.delete().catch(() => null), 6000))
      .catch(() => null);
  }

  for (const [, member] of message.mentions.members || []) {
    const afk = client.db.getAfk(message.guild.id, member.id);
    if (!afk) continue;
    message.channel
      .send({
        embeds: [
          info(
            `**${member.user.username}** is AFK: ${afk.reason}\nSince ${formatDuration(Date.now() - afk.since)}`
          ),
        ],
      })
      .then((m) => setTimeout(() => m.delete().catch(() => null), 7000))
      .catch(() => null);
  }
}

module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    if (!message.guild || message.author.bot) return;
    if (message.channel.type === ChannelType.DM) return;

    if (await runAutomod(client, message)) return;
    await handleAfk(client, message);

    const prefix = client.db.getPrefix(message.guild.id);
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const name = (args.shift() || '').toLowerCase();
    if (!name) return;

    const command =
      client.commands.get(name) ||
      client.commands.get(client.aliases.get(name));
    if (!command) return;

    const guildData = client.db.ensureGuild(message.guild.id);

    if (command.ownerOnly || command.permLevel === 'owner') {
      if (!client.config.ownerIds.includes(message.author.id)) {
        return message.reply({
          embeds: [error('This command is owner-only.')],
        });
      }
    } else if (
      !hasLevel(
        message.member,
        command.permLevel || 'user',
        guildData,
        client.config.ownerIds
      )
    ) {
      return message.reply({
        embeds: [
          error(
            `Missing permission. Required level: **${command.permLevel || 'user'}**.`
          ),
        ],
      });
    }

    if (command.botPermissions?.length) {
      const me = message.guild.members.me;
      const missing = command.botPermissions.filter((p) => !me.permissions.has(p));
      if (missing.length) {
        return message.reply({
          embeds: [error(`I am missing permissions: \`${missing.join('`, `')}\``)],
        });
      }
    }

    const now = Date.now();
    const cooldownMs = (command.cooldown ?? 3) * 1000;
    const bucket = client.cooldowns.get(command.name) || new Map();
    client.cooldowns.set(command.name, bucket);

    if (bucket.has(message.author.id)) {
      const expires = bucket.get(message.author.id) + cooldownMs;
      if (now < expires) {
        const left = ((expires - now) / 1000).toFixed(1);
        return message.reply({
          embeds: [error(`Please wait **${left}s**.`)],
        });
      }
    }
    bucket.set(message.author.id, now);
    setTimeout(() => bucket.delete(message.author.id), cooldownMs);

    try {
      await command.execute(client, message, args);
    } catch (err) {
      console.error(`[CMD:${command.name}]`, err);
      message
        .reply({ embeds: [error('Something went wrong while running that command.')] })
        .catch(() => null);
    }
  },
};
