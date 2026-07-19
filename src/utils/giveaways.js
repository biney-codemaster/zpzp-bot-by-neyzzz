const { EmbedBuilder } = require('discord.js');
const { color } = require('./embeds');

async function endGiveaway(client, messageId) {
  const giveaway = client.db.getGiveaway(messageId);
  if (!giveaway || giveaway.ended) return;

  client.db.updateGiveaway(messageId, { ended: 1 });

  const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
  if (!channel) return;

  const message = await channel.messages.fetch(messageId).catch(() => null);
  const entries = [...new Set(giveaway.entries || [])];
  const winnerCount = Math.min(giveaway.winners, entries.length);
  const winners = [];
  const pool = [...entries];

  for (let i = 0; i < winnerCount; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }

  const embed = new EmbedBuilder()
    .setColor(color())
    .setTitle('Giveaway terminé')
    .setDescription(
      [
        `**Lot :** ${giveaway.prize}`,
        `**Gagnant(s) :** ${
          winners.length
            ? winners.map((id) => `<@${id}>`).join(', ')
            : 'Personne (aucune participation)'
        }`,
        `**Participants :** ${entries.length}`,
      ].join('\n')
    )
    .setFooter({ text: `Organisé par ${giveaway.host_id}` })
    .setTimestamp();

  if (message) await message.edit({ embeds: [embed] }).catch(() => null);

  if (winners.length) {
    await channel
      .send(
        `Félicitations ${winners.map((id) => `<@${id}>`).join(', ')} ! Vous gagnez **${giveaway.prize}**.`
      )
      .catch(() => null);
  } else {
    await channel
      .send(`Giveaway **${giveaway.prize}** terminé sans participants.`)
      .catch(() => null);
  }
}

module.exports = { endGiveaway };
