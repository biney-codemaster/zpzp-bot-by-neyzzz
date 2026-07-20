const { PermissionFlagsBits } = require('discord.js');
const { error } = require('../utils/embeds');
const { hasLevel } = require('../utils/permissions');
const { sendModLog } = require('../utils/modlog');

/** Matches http(s), www, discord invites, and domain.tld style URLs */
const LINK_REGEX =
  /(?:https?:\/\/|www\.|discord\.gg\/|discord(?:app)?\.com\/invite\/|\b[a-z0-9][a-z0-9-]*\.[a-z]{2,}(?:\/[^\s]*)?)/i;

async function runAutomod(client, message) {
  if (!message.guild || message.author.bot) return false;

  const guildData = client.db.ensureGuild(message.guild.id);
  if (hasLevel(message.member, 'mod', guildData, client.config.ownerIds)) {
    return false;
  }
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return false;
  }

  if (guildData.automod_antilink && LINK_REGEX.test(message.content)) {
    await message.delete().catch(() => null);
    const warn = await message.channel
      .send({ embeds: [error(`${message.author}, links are not allowed here.`)] })
      .catch(() => null);
    if (warn) setTimeout(() => warn.delete().catch(() => null), 5000);
    return true;
  }

  if (guildData.automod_badwords) {
    let words = [];
    try {
      words = JSON.parse(guildData.badwords || '[]');
    } catch {
      words = [];
    }
    const content = message.content.toLowerCase();
    if (words.some((w) => w && content.includes(String(w).toLowerCase()))) {
      await message.delete().catch(() => null);
      const warn = await message.channel
        .send({ embeds: [error(`${message.author}, banned word detected.`)] })
        .catch(() => null);
      if (warn) setTimeout(() => warn.delete().catch(() => null), 5000);
      return true;
    }
  }

  if (guildData.automod_antispam) {
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const data = client.spamMap.get(key) || { count: 0, last: now };
    data.count = now - data.last < 5000 ? data.count + 1 : 1;
    data.last = now;
    client.spamMap.set(key, data);

    if (data.count >= 6) {
      client.spamMap.set(key, { count: 0, last: now });
      const reason = 'Anti-spam (6+ messages in 5s)';
      await message.member.timeout(30_000, reason).catch(() => null);
      await sendModLog(client, message.guild, {
        action: 'Auto-Mute',
        moderator: client.user,
        target: message.author,
        reason,
        duration: '30s',
        extra: 'Automod anti-spam',
      });
      await message.channel
        .send({ embeds: [error(`${message.author} timed out for 30s (spam).`)] })
        .catch(() => null);
      return true;
    }
  }

  return false;
}

module.exports = { runAutomod, LINK_REGEX };
