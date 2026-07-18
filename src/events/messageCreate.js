const { PermissionFlagsBits, ChannelType } = require('discord.js');
const { error, info } = require('../utils/embeds');
const { randomInt, xpForLevel, formatDuration } = require('../utils/helpers');
const config = require('../../config');

const LINK_REGEX = /https?:\/\/|discord\.gg\/|discord\.com\/invite\//i;

async function handleLevels(client, message) {
  const guildData = client.db.ensureGuild(message.guild.id);
  if (!guildData.levels_enabled) return;

  const row = client.db.ensureLevel(message.guild.id, message.author.id);
  if (Date.now() - row.last_xp < config.levels.cooldownMs) return;

  const gained = randomInt(config.levels.xpMin, config.levels.xpMax);
  let xp = row.xp + gained;
  let level = row.level;
  let leveledUp = false;
  let needed = xpForLevel(level);

  while (xp >= needed) {
    xp -= needed;
    level += 1;
    leveledUp = true;
    needed = xpForLevel(level);
  }

  client.db.updateLevel(message.guild.id, message.author.id, {
    xp,
    level,
    last_xp: Date.now(),
  });

  if (leveledUp) {
    const text = `🎉 ${message.author} passe au **niveau ${level}** !`;
    if (guildData.level_channel) {
      const ch = message.guild.channels.cache.get(guildData.level_channel);
      if (ch) return void ch.send(text).catch(() => null);
    }
    message.channel.send(text).catch(() => null);
  }
}

async function handleAutomod(client, message) {
  if (!message.guild || message.author.bot) return false;
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return false;

  const guildData = client.db.ensureGuild(message.guild.id);

  if (guildData.automod_antilink && LINK_REGEX.test(message.content)) {
    await message.delete().catch(() => null);
    const warnMsg = await message.channel
      .send({ embeds: [error(`${message.author}, les liens ne sont pas autorisés ici.`)] })
      .catch(() => null);
    if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => null), 5000);
    return true;
  }

  if (guildData.automod_badwords) {
    let badwords = [];
    try {
      badwords = JSON.parse(guildData.badwords || '[]');
    } catch {
      badwords = [];
    }
    const content = message.content.toLowerCase();
    if (badwords.some((w) => w && content.includes(String(w).toLowerCase()))) {
      await message.delete().catch(() => null);
      const warnMsg = await message.channel
        .send({ embeds: [error(`${message.author}, ton message contient un mot interdit.`)] })
        .catch(() => null);
      if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => null), 5000);
      return true;
    }
  }

  if (guildData.automod_antispam) {
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const data = client.spamMap.get(key) || { count: 0, last: now };
    if (now - data.last < 5000) {
      data.count += 1;
    } else {
      data.count = 1;
    }
    data.last = now;
    client.spamMap.set(key, data);

    if (data.count >= 6) {
      client.spamMap.set(key, { count: 0, last: now });
      await message.member.timeout(30_000, 'Anti-spam automatique').catch(() => null);
      await message.channel
        .send({
          embeds: [error(`${message.author} a été timeout 30s pour spam.`)],
        })
        .catch(() => null);
      return true;
    }
  }

  return false;
}

async function handleAfk(client, message) {
  const selfAfk = client.db.getAfk(message.guild.id, message.author.id);
  if (selfAfk) {
    client.db.removeAfk(message.guild.id, message.author.id);
    message.channel
      .send({
        embeds: [
          info(
            `Bon retour ${message.author} ! Ton AFK a été retiré.\nTu étais AFK depuis ${formatDuration(Date.now() - selfAfk.since)}.`
          ),
        ],
      })
      .then((m) => setTimeout(() => m.delete().catch(() => null), 7000))
      .catch(() => null);
  }

  if (message.mentions.members?.size) {
    for (const [, member] of message.mentions.members) {
      const afk = client.db.getAfk(message.guild.id, member.id);
      if (!afk) continue;
      message.channel
        .send({
          embeds: [
            info(
              `💤 **${member.user.username}** est AFK : ${afk.reason}\nDepuis ${formatDuration(Date.now() - afk.since)}`
            ),
          ],
        })
        .then((m) => setTimeout(() => m.delete().catch(() => null), 8000))
        .catch(() => null);
    }
  }
}

module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    if (!message.guild || message.author.bot) return;
    if (message.channel.type === ChannelType.DM) return;

    const blocked = await handleAutomod(client, message);
    if (blocked) return;

    await handleAfk(client, message);
    await handleLevels(client, message);

    const prefix = client.db.getPrefix(message.guild.id);
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = (args.shift() || '').toLowerCase();
    if (!commandName) return;

    const command =
      client.commands.get(commandName) ||
      client.commands.get(client.aliases.get(commandName));
    if (!command) return;

    if (command.ownerOnly && !config.ownerIds.includes(message.author.id)) {
      return message.reply({ embeds: [error('Cette commande est réservée au propriétaire du bot.')] });
    }

    if (command.guildOnly !== false && !message.guild) {
      return message.reply({ embeds: [error('Cette commande est utilisable uniquement en serveur.')] });
    }

    if (command.permissions?.length) {
      const missing = command.permissions.filter(
        (p) => !message.member.permissions.has(PermissionFlagsBits[p] ?? p)
      );
      if (missing.length) {
        return message.reply({
          embeds: [error(`Permissions manquantes : \`${missing.join('`, `')}\``)],
        });
      }
    }

    if (command.botPermissions?.length) {
      const me = message.guild.members.me;
      const missing = command.botPermissions.filter(
        (p) => !me.permissions.has(PermissionFlagsBits[p] ?? p)
      );
      if (missing.length) {
        return message.reply({
          embeds: [error(`Il me manque : \`${missing.join('`, `')}\``)],
        });
      }
    }

    const cooldownKey = `${command.name}:${message.author.id}`;
    const now = Date.now();
    const cooldownMs = (command.cooldown || 3) * 1000;
    const timestamps = client.cooldowns.get(command.name) || new Map();
    client.cooldowns.set(command.name, timestamps);

    if (timestamps.has(message.author.id)) {
      const expires = timestamps.get(message.author.id) + cooldownMs;
      if (now < expires) {
        const left = ((expires - now) / 1000).toFixed(1);
        return message.reply({
          embeds: [error(`Patiente encore **${left}s** avant de réutiliser \`${prefix}${command.name}\`.`)],
        });
      }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownMs);

    try {
      await command.execute(client, message, args);
    } catch (err) {
      console.error(`[CMD:${command.name}]`, err);
      message
        .reply({
          embeds: [error('Une erreur est survenue lors de l\'exécution de la commande.')],
        })
        .catch(() => null);
    }
  },
};
