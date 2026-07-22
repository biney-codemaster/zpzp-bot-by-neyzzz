const { fetchMember } = require('../../utils/helpers');
const { error } = require('../../utils/embeds');
const {
  getTttGame,
  setTttGame,
  clearTttGame,
  emptyBoard,
  renderBoard,
  buildTttComponents,
  buildTttEmbed,
} = require('../../services/funGames');

module.exports = {
  name: 'tictactoe',
  description: 'Play tic-tac-toe with buttons',
  category: 'fun',
  aliases: ['ttt', 'tictac'],
  usage: '[@member|quit]',
  permLevel: 'user',
  cooldown: 3,
  async execute(client, message, args) {
    const guildId = message.guild.id;
    const channelId = message.channel.id;
    const arg = (args[0] || '').toLowerCase();

    if (arg === 'quit' || arg === 'stop') {
      const existing = getTttGame(client, guildId, channelId);
      clearTttGame(client, guildId, channelId);
      if (existing?.messageId) {
        const channel = message.channel;
        const msg = await channel.messages.fetch(existing.messageId).catch(() => null);
        if (msg) {
          await msg
            .edit({
              embeds: [
                buildTttEmbed({
                  title: 'Tic-Tac-Toe',
                  description: 'Game ended.',
                }),
              ],
              components: [],
            })
            .catch(() => null);
        }
      }
      return message.reply({
        embeds: [
          buildTttEmbed({
            title: 'Tic-Tac-Toe',
            description: 'Game ended.',
          }),
        ],
      });
    }

    let game = getTttGame(client, guildId, channelId);
    if (game) {
      return message.reply({
        embeds: [
          error(
            'A tic-tac-toe game is already active in this channel. Use the Quit button or `+ttt quit`.'
          ),
        ],
      });
    }

    const member = await fetchMember(message, args[0]);
    if (member) {
      if (member.id === message.author.id) {
        return message.reply({ embeds: [error('You cannot challenge yourself.')] });
      }
      if (member.user.bot) {
        return message.reply({ embeds: [error('You cannot challenge a bot. Use `+ttt` to play vs bot.')] });
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

      const msg = await message.reply({
        embeds: [
          buildTttEmbed({
            title: 'Tic-Tac-Toe challenge',
            description: [
              `${message.author} challenged ${member}.`,
              `${member}, press **Accept** to play.`,
            ].join('\n'),
          }),
        ],
        components: buildTttComponents(game.board, { pending: true }),
      });

      game.messageId = msg.id;
      setTttGame(client, guildId, channelId, game);
      return;
    }

    game = {
      mode: 'bot',
      status: 'active',
      board: emptyBoard(),
      playerId: message.author.id,
    };

    const msg = await message.reply({
      embeds: [
        buildTttEmbed({
          title: 'Tic-Tac-Toe',
          description: [
            'You are **X**, bot is **O**.',
            renderBoard(game.board),
            '',
            'Click a cell to play.',
          ].join('\n'),
          footer: `${message.author.tag}'s turn`,
        }),
      ],
      components: buildTttComponents(game.board),
    });

    game.messageId = msg.id;
    setTttGame(client, guildId, channelId, game);
  },
};
