const { fetchMember } = require('../../utils/helpers');
const { info, error, success } = require('../../utils/embeds');
const {
  getTttGame,
  setTttGame,
  clearTttGame,
  emptyBoard,
  renderBoard,
  checkTttWinner,
  botMove,
} = require('../../services/funGames');

module.exports = {
  name: 'tictactoe',
  description: 'Play tic-tac-toe (prefix)',
  category: 'fun',
  aliases: ['ttt', 'tictac'],
  usage: '[1-9|@member|quit]',
  permLevel: 'user',
  cooldown: 3,
  async execute(client, message, args) {
    const guildId = message.guild.id;
    const channelId = message.channel.id;
    const arg = (args[0] || '').toLowerCase();

    if (arg === 'quit' || arg === 'stop') {
      clearTttGame(client, guildId, channelId);
      return message.reply({ embeds: [info('Tic-tac-toe game ended.')] });
    }

    let game = getTttGame(client, guildId, channelId);

    if (arg === 'accept') {
      if (!game || game.mode !== 'pvp' || game.status !== 'pending') {
        return message.reply({ embeds: [error('No pending challenge in this channel.')] });
      }
      if (message.author.id === game.challengerId) {
        return message.reply({ embeds: [error('You cannot accept your own challenge.')] });
      }
      if (message.author.id !== game.opponentId) {
        return message.reply({ embeds: [error('This challenge is not for you.')] });
      }
      game.status = 'active';
      game.turn = game.challengerId;
      setTttGame(client, guildId, channelId, game);
      return message.reply({
        embeds: [
          info(
            [
              `Game started: ${game.marks[game.challengerId]} vs ${game.marks[game.opponentId]}`,
              renderBoard(game.board),
              `<@${game.challengerId}> goes first. Use \`+ttt 1-9\`.`,
            ].join('\n'),
            'Tic-Tac-Toe'
          ),
        ],
      });
    }

    const member = await fetchMember(message, args[0]);
    if (member && !game) {
      if (member.id === message.author.id) {
        return message.reply({ embeds: [error('You cannot challenge yourself.')] });
      }
      game = {
        mode: 'pvp',
        status: 'pending',
        board: emptyBoard(),
        challengerId: message.author.id,
        opponentId: member.id,
        marks: {
          [message.author.id]: 'X',
          [member.id]: 'O',
        },
      };
      setTttGame(client, guildId, channelId, game);
      return message.reply({
        embeds: [
          info(
            `${message.author} challenged ${member} to tic-tac-toe.\n${member}, run \`+ttt accept\` to start.`,
            'Tic-Tac-Toe'
          ),
        ],
      });
    }

    const pos = Number(arg);
    if (Number.isInteger(pos) && pos >= 1 && pos <= 9) {
      if (!game || game.status !== 'active') {
        return message.reply({
          embeds: [error('No active game here. Start with `+ttt` or challenge someone.')],
        });
      }

      const idx = pos - 1;
      if (game.board[idx]) {
        return message.reply({ embeds: [error('That cell is already taken.')] });
      }

      if (game.mode === 'bot') {
        if (message.author.id !== game.playerId) {
          return message.reply({ embeds: [error('This is not your game.')] });
        }
        game.board[idx] = 'X';
        const result = checkTttWinner(game.board);
        if (result === 'X') {
          clearTttGame(client, guildId, channelId);
          client.db.addFunStat(guildId, message.author.id, 'ttt_wins');
          return message.reply({
            embeds: [success([renderBoard(game.board), '', 'You win!'].join('\n'), 'Tic-Tac-Toe')],
          });
        }
        if (result === 'tie') {
          clearTttGame(client, guildId, channelId);
          return message.reply({
            embeds: [info([renderBoard(game.board), '', 'Draw.'].join('\n'), 'Tic-Tac-Toe')],
          });
        }

        const botIdx = botMove(game.board, 'O', 'X');
        if (botIdx >= 0) game.board[botIdx] = 'O';
        const afterBot = checkTttWinner(game.board);
        if (afterBot === 'O') {
          clearTttGame(client, guildId, channelId);
          client.db.addFunStat(guildId, message.author.id, 'ttt_losses');
          return message.reply({
            embeds: [
              error([renderBoard(game.board), '', 'Bot wins.'].join('\n'), 'Tic-Tac-Toe'),
            ],
          });
        }
        if (afterBot === 'tie') {
          clearTttGame(client, guildId, channelId);
          return message.reply({
            embeds: [info([renderBoard(game.board), '', 'Draw.'].join('\n'), 'Tic-Tac-Toe')],
          });
        }

        setTttGame(client, guildId, channelId, game);
        return message.reply({
          embeds: [
            info([renderBoard(game.board), '', 'Your turn. Use `+ttt 1-9`.'].join('\n'), 'Tic-Tac-Toe'),
          ],
        });
      }

      if (game.mode === 'pvp') {
        if (message.author.id !== game.turn) {
          return message.reply({ embeds: [error('It is not your turn.')] });
        }
        const mark = game.marks[message.author.id];
        game.board[idx] = mark;
        const result = checkTttWinner(game.board);
        if (result === mark) {
          clearTttGame(client, guildId, channelId);
          client.db.addFunStat(guildId, message.author.id, 'ttt_wins');
          const loserId =
            message.author.id === game.challengerId
              ? game.opponentId
              : game.challengerId;
          client.db.addFunStat(guildId, loserId, 'ttt_losses');
          return message.reply({
            embeds: [
              success([renderBoard(game.board), '', `${message.author} wins!`].join('\n'), 'Tic-Tac-Toe'),
            ],
          });
        }
        if (result === 'tie') {
          clearTttGame(client, guildId, channelId);
          return message.reply({
            embeds: [info([renderBoard(game.board), '', 'Draw.'].join('\n'), 'Tic-Tac-Toe')],
          });
        }

        game.turn =
          game.turn === game.challengerId ? game.opponentId : game.challengerId;
        setTttGame(client, guildId, channelId, game);
        return message.reply({
          embeds: [
            info(
              [
                renderBoard(game.board),
                '',
                `<@${game.turn}>'s turn. Use \`+ttt 1-9\`.`,
              ].join('\n'),
              'Tic-Tac-Toe'
            ),
          ],
        });
      }
    }

    if (game) {
      return message.reply({
        embeds: [
          error(
            'Game already active in this channel. Use `+ttt 1-9` or `+ttt quit`.'
          ),
        ],
      });
    }

    game = {
      mode: 'bot',
      status: 'active',
      board: emptyBoard(),
      playerId: message.author.id,
    };
    setTttGame(client, guildId, channelId, game);

    return message.reply({
      embeds: [
        info(
          [
            'You are **X**, bot is **O**.',
            renderBoard(game.board),
            '',
            'Play with `+ttt 1-9` (center = 5).',
            'Quit with `+ttt quit`.',
          ].join('\n'),
          'Tic-Tac-Toe'
        ),
      ],
    });
  },
};
