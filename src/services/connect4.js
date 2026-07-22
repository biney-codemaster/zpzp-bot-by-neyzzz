const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const { color } = require('../utils/embeds');
const { applyComponentEmoji } = require('../utils/emoji');
const { pick } = require('../utils/helpers');

const ROWS = 6;
const COLS = 7;
const RED = '🔴';
const YELLOW = '🟡';
const EMPTY = '⚫';

function ensureMaps(client) {
  if (!client.c4Games) client.c4Games = new Map();
}

function channelKey(guildId, channelId) {
  return `${guildId}:${channelId}`;
}

function getC4Game(client, guildId, channelId) {
  ensureMaps(client);
  return client.c4Games.get(channelKey(guildId, channelId));
}

function setC4Game(client, guildId, channelId, game) {
  ensureMaps(client);
  client.c4Games.set(channelKey(guildId, channelId), game);
}

function clearC4Game(client, guildId, channelId) {
  ensureMaps(client);
  client.c4Games.delete(channelKey(guildId, channelId));
}

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function renderBoard(board) {
  const lines = [];
  for (let r = 0; r < ROWS; r += 1) {
    lines.push(board[r].map((c) => c || EMPTY).join(''));
  }
  lines.push('1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣');
  return lines.join('\n');
}

function canDrop(board, col) {
  return col >= 0 && col < COLS && board[0][col] === null;
}

function dropPiece(board, col, mark) {
  if (!canDrop(board, col)) return -1;
  for (let r = ROWS - 1; r >= 0; r -= 1) {
    if (board[r][col] === null) {
      board[r][col] = mark;
      return r;
    }
  }
  return -1;
}

function checkWinner(board, mark) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (board[r][c] !== mark) continue;
      for (const [dr, dc] of directions) {
        let count = 1;
        for (let i = 1; i < 4; i += 1) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (
            nr < 0 ||
            nr >= ROWS ||
            nc < 0 ||
            nc >= COLS ||
            board[nr][nc] !== mark
          ) {
            break;
          }
          count += 1;
        }
        if (count >= 4) return true;
      }
    }
  }
  return false;
}

function isBoardFull(board) {
  return board[0].every((c) => c !== null);
}

function validColumns(board) {
  const cols = [];
  for (let c = 0; c < COLS; c += 1) {
    if (canDrop(board, c)) cols.push(c);
  }
  return cols;
}

function botMove(board, botMark, playerMark) {
  const cols = validColumns(board);
  if (!cols.length) return -1;

  for (const col of cols) {
    const test = cloneBoard(board);
    dropPiece(test, col, botMark);
    if (checkWinner(test, botMark)) return col;
  }

  for (const col of cols) {
    const test = cloneBoard(board);
    dropPiece(test, col, playerMark);
    if (checkWinner(test, playerMark)) return col;
  }

  if (cols.includes(3)) return 3;
  return pick(cols);
}

function buildC4Components(board, { ended = false, pending = false } = {}) {
  if (pending) {
    const accept = new ButtonBuilder()
      .setCustomId('c4_accept')
      .setLabel('Accept')
      .setStyle(ButtonStyle.Success);
    applyComponentEmoji(accept, 'yes');
    const decline = new ButtonBuilder()
      .setCustomId('c4_decline')
      .setLabel('Decline')
      .setStyle(ButtonStyle.Danger);
    applyComponentEmoji(decline, 'no');
    return [new ActionRowBuilder().addComponents(accept, decline)];
  }

  const row1 = new ActionRowBuilder();
  const row2 = new ActionRowBuilder();

  for (let c = 0; c < 5; c += 1) {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`c4_drop:${c}`)
        .setLabel(String(c + 1))
        .setStyle(ButtonStyle.Primary)
        .setDisabled(ended || !canDrop(board, c))
    );
  }

  for (let c = 5; c < 7; c += 1) {
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(`c4_drop:${c}`)
        .setLabel(String(c + 1))
        .setStyle(ButtonStyle.Primary)
        .setDisabled(ended || !canDrop(board, c))
    );
  }

  const quit = new ButtonBuilder()
    .setCustomId('c4_quit')
    .setLabel('Quit')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(ended);
  applyComponentEmoji(quit, 'close');
  row2.addComponents(quit);

  return [row1, row2];
}

function buildC4Embed({ title, description, footer }) {
  const embed = new EmbedBuilder()
    .setColor(color())
    .setTitle(title || 'Connect Four')
    .setDescription(description)
    .setTimestamp();
  if (footer) embed.setFooter({ text: footer });
  return embed;
}

module.exports = {
  ROWS,
  COLS,
  RED,
  YELLOW,
  EMPTY,
  getC4Game,
  setC4Game,
  clearC4Game,
  emptyBoard,
  renderBoard,
  canDrop,
  dropPiece,
  checkWinner,
  isBoardFull,
  botMove,
  buildC4Components,
  buildC4Embed,
};
