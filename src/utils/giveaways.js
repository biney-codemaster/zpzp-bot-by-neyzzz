const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { color } = require('./embeds');
const { applyComponentEmoji } = require('./emoji');

function buildGiveawayComponents(ended = false) {
  if (ended) return [];
  const enter = new ButtonBuilder()
    .setCustomId('giveaway_enter')
    .setLabel('Enter')
    .setStyle(ButtonStyle.Primary);
  applyComponentEmoji(enter, 'enter');
  return [new ActionRowBuilder().addComponents(enter)];
}

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
    .setTitle('Giveaway ended')
    .setDescription(
      [
        `**Prize:** ${giveaway.prize}`,
        `**Winner(s):** ${
          winners.length
            ? winners.map((id) => `<@${id}>`).join(', ')
            : 'Nobody (no entries)'
        }`,
        `**Entries:** ${entries.length}`,
      ].join('\n')
    )
    .setFooter({ text: `Hosted by ${giveaway.host_id}` })
    .setTimestamp();

  if (message) {
    await message.edit({ embeds: [embed], components: [] }).catch(() => null);
  }

  if (winners.length) {
    await channel
      .send(
        `Congratulations ${winners.map((id) => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**.`
      )
      .catch(() => null);
  } else {
    await channel
      .send(`Giveaway **${giveaway.prize}** ended with no entries.`)
      .catch(() => null);
  }
}

module.exports = { endGiveaway, buildGiveawayComponents };
