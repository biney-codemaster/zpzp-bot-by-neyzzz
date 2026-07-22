const { fetchMember } = require('../../utils/helpers');
const { error } = require('../../utils/embeds');
const {
  getC4Game,
  setC4Game,
  clearC4Game,
  emptyBoard,
  renderBoard,
  buildC4Components,
  buildC4Embed,
  RED,
  YELLOW,
} = require('../../services/connect4');

module.exports = {
  name: 'connect4',
  description: 'Play Connect Four vs the bot, or challenge a member',
  category: 'fun',
  aliases: ['c4', 'puissance4', 'p4'],
  usage: '[@member|quit]',
  permLevel: 'user',
  cooldown: 3,
  async execute(client, message, args) {
    const guildId = message.guild.id;
    const channelId = message.channel.id;
    const arg = (args[0] || '').toLowerCase();

    if (arg === 'quit' || arg === 'stop') {
      const existing = getC4Game(client, guildId, channelId);
      clearC4Game(client, guildId, channelId);
      if (existing?.messageId) {
        const msg = await message.channel.messages
          .fetch(existing.messageId)
          .catch(() => null);
        if (msg) {
          await msg
            .edit({
              embeds: [
                buildC4Embed({
                  title: 'Connect Four',
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
          buildC4Embed({
            title: 'Connect Four',
            description: 'Game ended.',
          }),
        ],
      });
    }

    const game = getC4Game(client, guildId, channelId);
    if (game) {
      return message.reply({
        embeds: [
          error(
            'A Connect Four game is already active in this channel. Use the Quit button or `+connect4 quit`.'
          ),
        ],
      });
    }

    const member = await fetchMember(message, args[0]);
    if (member) {
      if (member.id === message.author.id) {
        return message.reply({
          embeds: [error('You cannot challenge yourself.')],
        });
      }
      if (member.user.bot) {
        return message.reply({
          embeds: [
            error('You cannot challenge a bot. Use `+connect4` to play vs bot.'),
          ],
        });
      }

      const challenge = {
        mode: 'pvp',
        status: 'pending',
        board: emptyBoard(),
        challengerId: message.author.id,
        opponentId: member.id,
        marks: {
          [message.author.id]: RED,
          [member.id]: YELLOW,
        },
      };

      const msg = await message.reply({
        embeds: [
          buildC4Embed({
            title: 'Connect Four challenge',
            description: [
              `${message.author} challenged ${member}.`,
              `${member}, press **Accept** to play.`,
              '',
              `You are ${RED}, opponent is ${YELLOW}.`,
            ].join('\n'),
          }),
        ],
        components: buildC4Components(challenge.board, { pending: true }),
      });

      challenge.messageId = msg.id;
      setC4Game(client, guildId, channelId, challenge);
      return;
    }

    const solo = {
      mode: 'bot',
      status: 'active',
      board: emptyBoard(),
      playerId: message.author.id,
    };

    const msg = await message.reply({
      embeds: [
        buildC4Embed({
          title: 'Connect Four',
          description: [
            `You are ${RED}, bot is ${YELLOW}.`,
            'Click a column (1-7) to drop a piece.',
            renderBoard(solo.board),
          ].join('\n'),
          footer: `${message.author.tag}'s turn`,
        }),
      ],
      components: buildC4Components(solo.board),
    });

    solo.messageId = msg.id;
    setC4Game(client, guildId, channelId, solo);
  },
};
