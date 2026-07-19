const { EmbedBuilder } = require('discord.js');
const { color } = require('./embeds');
const { withEmoji } = require('./emoji');

async function sendModLog(client, guild, {
  action,
  moderator,
  target,
  reason,
  extra,
  caseId,
}) {
  const guildData = client.db.ensureGuild(guild.id);
  const caseNumber =
    caseId ||
    client.db.addModCase(guild.id, {
      userId: target?.id || target || null,
      moderatorId: moderator.id,
      action,
      reason,
      extra,
    });

  if (!guildData.modlog_channel) return caseNumber;

  const channel = guild.channels.cache.get(guildData.modlog_channel);
  if (!channel) return caseNumber;

  const targetText = target
    ? typeof target === 'string'
      ? `\`${target}\``
      : `${target} (\`${target.id}\`)`
    : 'N/A';

  const embed = new EmbedBuilder()
    .setColor(color())
    .setAuthor({
      name: withEmoji('moderation', `Moderation • ${action}`),
      iconURL: moderator.displayAvatarURL?.({ size: 64 }) || undefined,
    })
    .addFields(
      { name: 'Case', value: `#${caseNumber}`, inline: true },
      { name: 'Action', value: action, inline: true },
      { name: 'Moderator', value: `${moderator} (\`${moderator.id}\`)`, inline: true },
      { name: 'Target', value: targetText, inline: false },
      { name: 'Reason', value: reason || 'No reason provided' }
    )
    .setTimestamp();

  if (extra) embed.addFields({ name: 'Details', value: String(extra).slice(0, 1024) });

  await channel.send({ embeds: [embed] }).catch(() => null);
  return caseNumber;
}

module.exports = { sendModLog };
