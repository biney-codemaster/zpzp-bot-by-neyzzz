const { EmbedBuilder } = require('discord.js');

async function sendModLog(client, guild, { action, moderator, target, reason, extra }) {
  const guildData = client.db.ensureGuild(guild.id);
  if (!guildData.modlog_channel) return;

  const channel = guild.channels.cache.get(guildData.modlog_channel);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle(`🛡️ ${action}`)
    .addFields(
      { name: 'Modérateur', value: `${moderator} (\`${moderator.id}\`)`, inline: true },
      {
        name: 'Cible',
        value: target ? `${target} (\`${target.id || target}\`)` : 'N/A',
        inline: true,
      },
      { name: 'Raison', value: reason || 'Aucune raison' }
    )
    .setTimestamp();

  if (extra) embed.addFields({ name: 'Détails', value: extra });

  await channel.send({ embeds: [embed] }).catch(() => null);
}

module.exports = { sendModLog };
