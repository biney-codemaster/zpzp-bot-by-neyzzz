const { EmbedBuilder } = require('discord.js');
const { color } = require('./embeds');
const { withEmoji } = require('./emoji');

function resolveTarget(target) {
  if (!target) return { text: 'N/A', avatar: null, id: null };
  if (typeof target === 'string') {
    return { text: `\`${target}\``, avatar: null, id: target };
  }
  return {
    text: `${target} (\`${target.id}\`)`,
    avatar: target.displayAvatarURL?.({ size: 256 }) || null,
    id: target.id,
  };
}

function buildCaseEmbed({
  caseId,
  action,
  moderator,
  target,
  reason,
  extra,
  duration,
  createdAt,
}) {
  const targetInfo = resolveTarget(target);

  const embed = new EmbedBuilder()
    .setColor(color())
    .setAuthor({
      name: withEmoji('moderation', `Moderation • ${action}`),
      iconURL: moderator.displayAvatarURL?.({ size: 64 }) || undefined,
    })
    .addFields(
      { name: 'Case', value: `#${caseId}`, inline: true },
      { name: 'Action', value: action, inline: true },
      {
        name: 'Moderator',
        value: `${moderator} (\`${moderator.id}\`)`,
        inline: true,
      },
      { name: 'Target', value: targetInfo.text, inline: false },
      { name: 'Reason', value: reason || 'No reason provided' }
    );

  if (duration) {
    embed.addFields({ name: 'Duration', value: duration, inline: true });
  }

  if (extra) {
    embed.addFields({ name: 'Details', value: String(extra).slice(0, 1024) });
  }

  if (targetInfo.avatar) {
    embed.setThumbnail(targetInfo.avatar);
  }

  if (createdAt) {
    embed.setTimestamp(createdAt);
  } else {
    embed.setTimestamp();
  }

  return embed;
}

async function sendModLog(client, guild, {
  action,
  moderator,
  target,
  reason,
  extra,
  caseId,
  duration,
  skipCase = false,
}) {
  const guildData = client.db.ensureGuild(guild.id);
  const caseNumber =
    caseId ||
    (skipCase
      ? null
      : client.db.addModCase(guild.id, {
          userId: resolveTarget(target).id,
          moderatorId: moderator.id,
          action,
          reason,
          extra: duration ? `${duration}${extra ? ` • ${extra}` : ''}` : extra,
        }));

  if (!guildData.modlog_channel) return caseNumber;

  const channel = guild.channels.cache.get(guildData.modlog_channel);
  if (!channel) return caseNumber;

  const embed = buildCaseEmbed({
    caseId: caseNumber,
    action,
    moderator,
    target,
    reason,
    extra,
    duration,
  });

  await channel.send({ embeds: [embed] }).catch(() => null);
  return caseNumber;
}

function formatCaseRow(c) {
  const extra = c.extra ? `\n_${c.extra}_` : '';
  const reason = c.reason || 'No reason provided';
  return `\`#${c.id}\` **${c.action}** — <t:${Math.floor(c.created_at / 1000)}:R> — <@${c.moderator_id}>\n${reason}${extra}`;
}

function formatWarnRow(w) {
  return `\`#${w.id}\` — <t:${Math.floor(w.created_at / 1000)}:R> — <@${w.moderator_id}>\n${w.reason}`;
}

module.exports = {
  sendModLog,
  buildCaseEmbed,
  formatCaseRow,
  formatWarnRow,
  resolveTarget,
};
