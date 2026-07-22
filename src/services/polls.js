const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const { color } = require('../utils/embeds');
const { applyComponentEmoji } = require('../utils/emoji');
const { hasLevel } = require('../utils/permissions');

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function countVotes(votes, optionCount) {
  const counts = Array(optionCount).fill(0);
  for (const idx of Object.values(votes)) {
    const i = Number(idx);
    if (i >= 0 && i < optionCount) counts[i] += 1;
  }
  return counts;
}

function buildPollEmbed(poll, authorTag) {
  const counts = countVotes(poll.votes, poll.options.length);
  const total = counts.reduce((a, b) => a + b, 0);

  const lines = poll.options.map((opt, i) => {
    const n = counts[i];
    const pct = total ? Math.round((n / total) * 100) : 0;
    const bar =
      total === 0
        ? ''
        : ` \`${'█'.repeat(Math.round(pct / 10))}${'░'.repeat(10 - Math.round(pct / 10))}\` ${pct}%`;
    return `**${LABELS[i]}.** ${opt} — **${n}** vote${n === 1 ? '' : 's'}${bar}`;
  });

  const embed = new EmbedBuilder()
    .setColor(color())
    .setTitle(poll.ended ? 'Poll (ended)' : 'Poll')
    .setDescription(`**${poll.question}**\n\n${lines.join('\n')}`)
    .setFooter({
      text: `${authorTag || 'Poll'} • ${total} total vote${total === 1 ? '' : 's'}`,
    })
    .setTimestamp(poll.created_at || Date.now());

  return embed;
}

function buildPollComponents(messageId, options, ended = false) {
  if (ended) return [];

  const rows = [];
  let current = new ActionRowBuilder();

  options.forEach((opt, i) => {
    if (current.components.length === 5) {
      rows.push(current);
      current = new ActionRowBuilder();
    }
    const label = `${LABELS[i]}: ${opt}`.slice(0, 80);
    current.addComponents(
      new ButtonBuilder()
        .setCustomId(`poll_vote:${messageId}:${i}`)
        .setLabel(label)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  if (current.components.length) rows.push(current);

  if (rows.length < 5) {
    const end = new ButtonBuilder()
      .setCustomId(`poll_end:${messageId}`)
      .setLabel('End poll')
      .setStyle(ButtonStyle.Danger);
    applyComponentEmoji(end, 'close');
    rows.push(new ActionRowBuilder().addComponents(end));
  }

  return rows;
}

async function handlePollVote(client, interaction) {
  const [, messageId, indexStr] = interaction.customId.split(':');
  const optionIndex = Number(indexStr);
  const poll = client.db.getPoll(messageId);

  if (!poll || poll.ended) {
    return interaction.reply({
      content: 'This poll is no longer active.',
      ephemeral: true,
    });
  }

  if (Number.isNaN(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
    return interaction.reply({
      content: 'Invalid option.',
      ephemeral: true,
    });
  }

  const votes = { ...poll.votes };
  const previous = votes[interaction.user.id];
  votes[interaction.user.id] = optionIndex;
  client.db.updatePoll(messageId, { votes });

  const updated = { ...poll, votes };
  const authorTag = interaction.message.embeds[0]?.footer?.text?.split(' • ')[0];

  await interaction.update({
    embeds: [buildPollEmbed(updated, authorTag)],
    components: buildPollComponents(messageId, poll.options, false),
  });

  if (previous !== undefined && Number(previous) === optionIndex) {
    return interaction.followUp({
      content: `Your vote stays on **${LABELS[optionIndex]}**.`,
      ephemeral: true,
    }).catch(() => null);
  }

  return interaction.followUp({
    content:
      previous === undefined
        ? `Voted for **${LABELS[optionIndex]}**.`
        : `Changed vote to **${LABELS[optionIndex]}**.`,
    ephemeral: true,
  }).catch(() => null);
}

async function handlePollEnd(client, interaction) {
  const messageId = interaction.customId.split(':')[1];
  const poll = client.db.getPoll(messageId);

  if (!poll) {
    return interaction.reply({
      content: 'Poll not found.',
      ephemeral: true,
    });
  }

  if (poll.ended) {
    return interaction.reply({
      content: 'This poll has already ended.',
      ephemeral: true,
    });
  }

  const guildData = client.db.ensureGuild(interaction.guild.id);
  const isAuthor = interaction.user.id === poll.author_id;
  const isMod = hasLevel(
    interaction.member,
    'mod',
    guildData,
    client.config.ownerIds
  );

  if (!isAuthor && !isMod) {
    return interaction.reply({
      content: 'Only the poll author or staff can end this poll.',
      ephemeral: true,
    });
  }

  client.db.updatePoll(messageId, { ended: 1 });
  const updated = { ...poll, ended: 1 };
  const authorTag = interaction.message.embeds[0]?.footer?.text?.split(' • ')[0];

  return interaction.update({
    embeds: [buildPollEmbed(updated, authorTag)],
    components: [],
  });
}

module.exports = {
  LABELS,
  countVotes,
  buildPollEmbed,
  buildPollComponents,
  handlePollVote,
  handlePollEnd,
};
