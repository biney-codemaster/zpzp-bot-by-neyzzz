const { EmbedBuilder } = require('discord.js');
const { color, info } = require('../../utils/embeds');

function statLine(label, value) {
  return `**${label}:** ${value}`;
}

module.exports = {
  name: 'leaderboard',
  description: 'Fun game leaderboard',
  category: 'fun',
  aliases: ['funlb', 'lb'],
  usage: '[member]',
  permLevel: 'user',
  async execute(client, message, args) {
    const prefix = client.db.getPrefix(message.guild.id);

    if (args[0]) {
      const { fetchMember } = require('../../utils/helpers');
      const member = (await fetchMember(message, args[0])) || message.member;
      const s = client.db.getFunStats(message.guild.id, member.id);
      const score =
        s.rps_wins * 2 +
        s.trivia_correct * 3 +
        s.ttt_wins * 5 +
        s.hangman_wins * 4;

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle(`Fun stats — ${member.user.tag}`)
            .setDescription(
              [
                statLine('Score', score),
                '',
                statLine('RPS wins', s.rps_wins),
                statLine('RPS losses', s.rps_losses),
                statLine('RPS ties', s.rps_ties),
                statLine('Trivia correct', s.trivia_correct),
                statLine('Trivia wrong', s.trivia_wrong),
                statLine('Tic-tac-toe wins', s.ttt_wins),
                statLine('Tic-tac-toe losses', s.ttt_losses),
                statLine('Hangman wins', s.hangman_wins),
              ].join('\n')
            )
            .setFooter({
              text: 'Score = RPSx2 + Triviax3 + TTTx5 + Hangmanx4',
            })
            .setTimestamp(),
        ],
      });
    }

    const rows = client.db.getFunLeaderboard(message.guild.id, 10);
    const active = rows.filter((r) => r.score > 0);

    if (!active.length) {
      return message.reply({
        embeds: [
          info(
            [
              'No scores yet.',
              `Play \`${prefix}rps\`, \`${prefix}trivia\`, \`${prefix}ttt\`, or \`${prefix}hangman\`.`,
            ].join('\n'),
            'Fun leaderboard'
          ),
        ],
      });
    }

    const lines = active.map((r, i) => {
      const medal =
        i === 0 ? '1.' : i === 1 ? '2.' : i === 2 ? '3.' : `${i + 1}.`;
      return `${medal} <@${r.user_id}> — **${r.score}** pts (RPS ${r.rps_wins} • Trivia ${r.trivia_correct} • TTT ${r.ttt_wins} • Hangman ${r.hangman_wins})`;
    });

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(`Fun leaderboard — ${message.guild.name}`)
          .setDescription(lines.join('\n'))
          .setFooter({
            text: `Your stats: ${prefix}leaderboard @you`,
          })
          .setTimestamp(),
      ],
    });
  },
};
