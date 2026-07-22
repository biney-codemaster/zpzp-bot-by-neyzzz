const { EmbedBuilder } = require('discord.js');
const { color, error, success, info } = require('../../utils/embeds');
const { fetchTriviaQuestion } = require('../../services/funApi');
const {
  getTriviaSession,
  setTriviaSession,
  clearTriviaSession,
  answersMatch,
} = require('../../services/funGames');

module.exports = {
  name: 'trivia',
  description: 'Start or answer a trivia question',
  category: 'fun',
  aliases: ['quiz'],
  usage: '[answer]',
  permLevel: 'user',
  cooldown: 5,
  async execute(client, message, args) {
    const existing = getTriviaSession(client, message.guild.id, message.author.id);
    if (existing && Date.now() > existing.expiresAt) {
      clearTriviaSession(client, message.guild.id, message.author.id);
    }

    const session = getTriviaSession(client, message.guild.id, message.author.id);
    const answer = args.join(' ').trim();

    if (answer && !session) {
      return message.reply({
        embeds: [error('No active trivia question. Run `+trivia` first.')],
      });
    }

    if (session && answer) {
      clearTriviaSession(client, message.guild.id, message.author.id);
      const correct = answersMatch(answer, session.correct);
      client.db.addFunStat(
        message.guild.id,
        message.author.id,
        correct ? 'trivia_correct' : 'trivia_wrong'
      );

      if (correct) {
        return message.reply({
          embeds: [
            success(
              `Correct! The answer was **${session.correct}**.`,
              'Trivia'
            ),
          ],
        });
      }

      return message.reply({
        embeds: [
          error(
            `Wrong. The correct answer was **${session.correct}**.`,
            'Trivia'
          ),
        ],
      });
    }

    if (session && !answer) {
      return message.reply({
        embeds: [
          error(
            'You already have an active question. Reply with `+trivia <answer>`.'
          ),
        ],
      });
    }

    try {
      const q = await fetchTriviaQuestion();
      setTriviaSession(client, message.guild.id, message.author.id, q);

      const optionsText = q.options
        .map((opt, i) => `**${i + 1}.** ${opt}`)
        .join('\n');

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle('Trivia')
            .setDescription(
              [
                q.question,
                '',
                optionsText,
                '',
                'Reply with `+trivia <answer>` within 60 seconds.',
              ].join('\n')
            )
            .addFields(
              { name: 'Category', value: q.category, inline: true },
              { name: 'Difficulty', value: q.difficulty, inline: true }
            )
            .setFooter({ text: q.source })
            .setTimestamp(),
        ],
      });
    } catch (err) {
      console.error('[trivia]', err);
      return message.reply({
        embeds: [error('Could not fetch a trivia question. Try again later.')],
      });
    }
  },
};
