const { success, error, info } = require('../../utils/embeds');
const {
  getHangman,
  setHangman,
  clearHangman,
  startHangman,
  hangmanDisplay,
  hangmanGuess,
} = require('../../services/funGames');

module.exports = {
  name: 'hangman',
  description: 'Play hangman (prefix)',
  category: 'fun',
  usage: 'start | <letter> | quit',
  permLevel: 'user',
  cooldown: 3,
  async execute(client, message, args) {
    const sub = (args[0] || 'start').toLowerCase();
    const guildId = message.guild.id;
    const userId = message.author.id;

    if (sub === 'quit' || sub === 'stop' || sub === 'end') {
      clearHangman(client, guildId, userId);
      return message.reply({ embeds: [info('Hangman game ended.')] });
    }

    if (sub === 'start' || sub === 'new') {
      const game = startHangman();
      setHangman(client, guildId, userId, game);
      return message.reply({
        embeds: [
          info(
            [
              hangmanDisplay(game),
              '',
              'Guess with `+hangman <letter>` (example: `+hangman e`).',
              'Quit with `+hangman quit`.',
            ].join('\n'),
            'Hangman'
          ),
        ],
      });
    }

    let game = getHangman(client, guildId, userId);
    if (!game) {
      game = startHangman();
      setHangman(client, guildId, userId, game);
    }

    const letterArg = sub.length === 1 ? sub : args[0];
    const result = hangmanGuess(game, letterArg);

    if (result.error) {
      return message.reply({ embeds: [error(result.error)] });
    }

    if (result.won) {
      clearHangman(client, guildId, userId);
      client.db.addFunStat(guildId, userId, 'hangman_wins');
      return message.reply({
        embeds: [
          success(
            [
              hangmanDisplay(game),
              '',
              `You guessed the word: **${game.word}**!`,
            ].join('\n'),
            'Hangman — You win'
          ),
        ],
      });
    }

    if (result.lost) {
      clearHangman(client, guildId, userId);
      return message.reply({
        embeds: [
          error(
            [
              hangmanDisplay(game),
              '',
              `Game over. The word was **${game.word}**.`,
            ].join('\n'),
            'Hangman — You lose'
          ),
        ],
      });
    }

    setHangman(client, guildId, userId, game);
    return message.reply({
      embeds: [
        info(
          [
            hangmanDisplay(game),
            '',
            `Letter **${result.char.toUpperCase()}** — keep guessing.`,
          ].join('\n'),
          'Hangman'
        ),
      ],
    });
  },
};
