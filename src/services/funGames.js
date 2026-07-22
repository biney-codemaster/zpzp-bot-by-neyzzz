const { pick, randomInt } = require('../utils/helpers');
const { HANGMAN_WORDS } = require('../utils/funContent');

function sessionKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

function channelKey(guildId, channelId) {
  return `${guildId}:${channelId}`;
}

function ensureMaps(client) {
  if (!client.funSessions) client.funSessions = new Map();
  if (!client.tttGames) client.tttGames = new Map();
}

function getTriviaSession(client, guildId, userId) {
  ensureMaps(client);
  return client.funSessions.get(`trivia:${sessionKey(guildId, userId)}`);
}

function setTriviaSession(client, guildId, userId, data) {
  ensureMaps(client);
  client.funSessions.set(`trivia:${sessionKey(guildId, userId)}`, {
    ...data,
    expiresAt: Date.now() + 60_000,
  });
}

function clearTriviaSession(client, guildId, userId) {
  ensureMaps(client);
  client.funSessions.delete(`trivia:${sessionKey(guildId, userId)}`);
}

function getHangman(client, guildId, userId) {
  ensureMaps(client);
  return client.funSessions.get(`hangman:${sessionKey(guildId, userId)}`);
}

function setHangman(client, guildId, userId, game) {
  ensureMaps(client);
  client.funSessions.set(`hangman:${sessionKey(guildId, userId)}`, game);
}

function clearHangman(client, guildId, userId) {
  ensureMaps(client);
  client.funSessions.delete(`hangman:${sessionKey(guildId, userId)}`);
}

function startHangman() {
  const word = pick(HANGMAN_WORDS).toLowerCase();
  return {
    word,
    guessed: new Set(),
    wrong: 0,
    maxWrong: 6,
  };
}

function hangmanDisplay(game) {
  const masked = game.word
    .split('')
    .map((c) => (game.guessed.has(c) ? c : '_'))
    .join(' ');
  const stages = [
    '   +---+\n       |\n       |\n       |\n      ===',
    '   +---+\n   O   |\n       |\n       |\n      ===',
    '   +---+\n   O   |\n   |   |\n       |\n      ===',
    '   +---+\n   O   |\n  /|   |\n       |\n      ===',
    '   +---+\n   O   |\n  /|\\  |\n       |\n      ===',
    '   +---+\n   O   |\n  /|\\  |\n  /    |\n      ===',
    '   +---+\n   O   |\n  /|\\  |\n  / \\  |\n      ===',
  ];
  const guessed = [...game.guessed].sort().join(', ') || 'None';
  return [
    `\`\`\`${stages[game.wrong] || stages[0]}\`\`\``,
    `Word: **${masked}**`,
    `Wrong guesses: **${game.wrong}/${game.maxWrong}**`,
    `Letters tried: ${guessed}`,
  ].join('\n');
}

function hangmanGuess(game, letter) {
  const char = letter.toLowerCase()[0];
  if (!char || !/^[a-z]$/.test(char)) return { error: 'Provide a single letter A-Z.' };
  if (game.guessed.has(char)) return { error: 'You already tried that letter.' };

  game.guessed.add(char);
  if (!game.word.includes(char)) game.wrong += 1;

  const won = game.word.split('').every((c) => game.guessed.has(c));
  const lost = game.wrong >= game.maxWrong;
  return { won, lost, char };
}

function getTttGame(client, guildId, channelId) {
  ensureMaps(client);
  return client.tttGames.get(channelKey(guildId, channelId));
}

function setTttGame(client, guildId, channelId, game) {
  ensureMaps(client);
  client.tttGames.set(channelKey(guildId, channelId), game);
}

function clearTttGame(client, guildId, channelId) {
  ensureMaps(client);
  client.tttGames.delete(channelKey(guildId, channelId));
}

function emptyBoard() {
  return Array(9).fill(null);
}

function renderBoard(board) {
  const cell = (i) => board[i] || '-';
  return [
    `\`${cell(0)} | ${cell(1)} | ${cell(2)}\``,
    `\`${cell(3)} | ${cell(4)} | ${cell(5)}\``,
    `\`${cell(6)} | ${cell(7)} | ${cell(8)}\``,
  ].join('\n');
}

function buildTttComponents(board, { ended = false, pending = false } = {}) {
  const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
  } = require('discord.js');
  const { applyComponentEmoji } = require('../utils/emoji');

  if (pending) {
    const accept = new ButtonBuilder()
      .setCustomId('ttt_accept')
      .setLabel('Accept')
      .setStyle(ButtonStyle.Success);
    applyComponentEmoji(accept, 'yes');
    const decline = new ButtonBuilder()
      .setCustomId('ttt_decline')
      .setLabel('Decline')
      .setStyle(ButtonStyle.Danger);
    applyComponentEmoji(decline, 'no');
    return [new ActionRowBuilder().addComponents(accept, decline)];
  }

  const rows = [];
  for (let r = 0; r < 3; r += 1) {
    const row = new ActionRowBuilder();
    for (let c = 0; c < 3; c += 1) {
      const i = r * 3 + c;
      const mark = board[i];
      let style = ButtonStyle.Secondary;
      let label = '-';
      if (mark === 'X') {
        label = 'X';
        style = ButtonStyle.Primary;
      } else if (mark === 'O') {
        label = 'O';
        style = ButtonStyle.Danger;
      }
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`ttt_cell:${i}`)
          .setLabel(label)
          .setStyle(style)
          .setDisabled(ended || Boolean(mark))
      );
    }
    rows.push(row);
  }

  const quit = new ButtonBuilder()
    .setCustomId('ttt_quit')
    .setLabel('Quit')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(ended);
  applyComponentEmoji(quit, 'close');
  rows.push(new ActionRowBuilder().addComponents(quit));
  return rows;
}

function buildTttEmbed({ title, description, footer }) {
  const { EmbedBuilder } = require('discord.js');
  const { color } = require('../utils/embeds');
  const embed = new EmbedBuilder()
    .setColor(color())
    .setTitle(title || 'Tic-Tac-Toe')
    .setDescription(description)
    .setTimestamp();
  if (footer) embed.setFooter({ text: footer });
  return embed;
}

function checkTttWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every(Boolean)) return 'tie';
  return null;
}

function botMove(board, botMark, playerMark) {
  const tryMove = (mark) => {
    for (let i = 0; i < 9; i += 1) {
      if (board[i]) continue;
      board[i] = mark;
      const win = checkTttWinner(board) === mark;
      board[i] = null;
      if (win) return i;
    }
    return null;
  };

  const winMove = tryMove(botMark);
  if (winMove !== null) return winMove;
  const blockMove = tryMove(playerMark);
  if (blockMove !== null) return blockMove;

  const corners = [0, 2, 6, 8].filter((i) => !board[i]);
  if (corners.length) return pick(corners);
  const sides = [1, 3, 5, 7].filter((i) => !board[i]);
  if (sides.length) return pick(sides);
  return board.findIndex((c) => !c);
}

function normalizeAnswer(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '');
}

function answersMatch(given, correct) {
  return normalizeAnswer(given) === normalizeAnswer(correct);
}

function rateScore() {
  return randomInt(0, 100);
}

module.exports = {
  getTriviaSession,
  setTriviaSession,
  clearTriviaSession,
  getHangman,
  setHangman,
  clearHangman,
  startHangman,
  hangmanDisplay,
  hangmanGuess,
  getTttGame,
  setTttGame,
  clearTttGame,
  emptyBoard,
  renderBoard,
  buildTttComponents,
  buildTttEmbed,
  checkTttWinner,
  botMove,
  answersMatch,
  rateScore,
};
