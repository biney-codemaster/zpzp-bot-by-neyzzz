const {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { error, success, color, info } = require('../utils/embeds');
const {
  buildHomeEmbed,
  buildCategoryEmbed,
  buildHelpComponents,
} = require('../utils/helpMenu');
const { withEmoji } = require('../utils/emoji');
const {
  isTicketStaff,
  openTicket,
  finalizeClose,
  sendStandaloneTranscript,
  closeConfirmComponents,
  userSelectRow,
} = require('../services/tickets');
const {
  buildSetupEmbed,
  mainMenu,
  categoryPicker,
  supportPicker,
  logsPicker,
  panelPicker,
  pickerEmbed,
  postPanel,
  assertOwner,
} = require('../services/ticketSetup');
const { hasLevel } = require('../utils/permissions');
const { parseDuration } = require('../utils/helpers');
const { handlePollVote, handlePollEnd } = require('../services/polls');
const {
  parseEntryMap,
  entryStats,
  checkEligibility,
  entryWeight,
  refreshGiveawayMessage,
  getGiveawaySettings,
} = require('../services/giveaways');
const {
  getTttGame,
  setTttGame,
  clearTttGame,
  renderBoard,
  buildTttComponents,
  buildTttEmbed,
  checkTttWinner,
  botMove,
} = require('../services/funGames');
const {
  getC4Game,
  setC4Game,
  clearC4Game,
  renderBoard: renderC4Board,
  buildC4Components,
  buildC4Embed,
  dropPiece,
  checkWinner: checkC4Winner,
  isBoardFull,
  botMove: c4BotMove,
  RED,
  YELLOW,
} = require('../services/connect4');
const {
  buildCreateEmbed: buildGiveawayCreateEmbed,
  mainMenu: giveawayCreateMenu,
  backRow: giveawayCreateBackRow,
  rolePicker: giveawayCreateRolePicker,
  channelPicker: giveawayCreateChannelPicker,
  prizeModal: giveawayPrizeModal,
  durationModal: giveawayDurationModal,
  winnersModal: giveawayWinnersModal,
  minAgeModal: giveawayCreateMinAgeModal,
  bonusEntriesModal: giveawayCreateBonusModal,
  pickerEmbed: giveawayCreatePickerEmbed,
  assertOwner: assertGiveawayCreateOwner,
  getDraft,
  setDraft,
  clearDraft,
  defaultDraft,
  postGiveaway,
} = require('../services/giveawayCreate');
const {
  buildWelcomeEmbed,
  mainMenu: welcomeMainMenu,
  channelPicker: welcomeChannelPicker,
  messageModal: welcomeMessageModal,
  pickerEmbed: welcomePickerEmbed,
  buildPreviewEmbed: buildWelcomePreview,
  resetWelcome,
  assertOwner: assertWelcomeOwner,
} = require('../services/welcomeSetup');
const {
  buildLeaveEmbed,
  mainMenu: leaveMainMenu,
  channelPicker: leaveChannelPicker,
  messageModal: leaveMessageModal,
  pickerEmbed: leavePickerEmbed,
  buildPreviewEmbed: buildLeavePreview,
  resetLeave,
  assertOwner: assertLeaveOwner,
} = require('../services/leaveSetup');
const {
  buildAutomodEmbed,
  mainMenu: automodMainMenu,
  punishPicker,
  ignoreChannelPicker,
  ignoreRolePicker,
  badwordsMenu,
  removeWordPicker,
  addWordModal,
  timeoutModal,
  pickerEmbed: automodPickerEmbed,
  resetAutomod,
  assertOwner: assertAutomodOwner,
  parseJsonArray,
} = require('../services/automodSetup');
const { fullConfigReset } = require('../services/configDefaults');

async function handleConnect4(client, interaction) {
  if (!interaction.isButton() || !interaction.guild) return;

  const id = interaction.customId;
  if (
    id !== 'c4_accept' &&
    id !== 'c4_decline' &&
    id !== 'c4_quit' &&
    !id.startsWith('c4_drop:')
  ) {
    return;
  }

  const guildId = interaction.guild.id;
  const channelId = interaction.channel.id;
  const game = getC4Game(client, guildId, channelId);

  if (!game) {
    return interaction.reply({
      embeds: [error('No active Connect Four game here.')],
      ephemeral: true,
    });
  }

  if (game.messageId && game.messageId !== interaction.message.id) {
    return interaction.reply({
      embeds: [error('This board is outdated. Use the latest game message.')],
      ephemeral: true,
    });
  }

  if (id === 'c4_decline') {
    if (
      interaction.user.id !== game.opponentId &&
      interaction.user.id !== game.challengerId
    ) {
      return interaction.reply({
        embeds: [error('Only the challenged player can decline.')],
        ephemeral: true,
      });
    }
    clearC4Game(client, guildId, channelId);
    return interaction.update({
      embeds: [
        buildC4Embed({
          title: 'Connect Four',
          description: 'Challenge declined.',
        }),
      ],
      components: [],
    });
  }

  if (id === 'c4_accept') {
    if (game.mode !== 'pvp' || game.status !== 'pending') {
      return interaction.reply({
        embeds: [error('No pending challenge.')],
        ephemeral: true,
      });
    }
    if (interaction.user.id !== game.opponentId) {
      return interaction.reply({
        embeds: [error('Only the challenged player can accept.')],
        ephemeral: true,
      });
    }
    game.status = 'active';
    game.turn = game.challengerId;
    setC4Game(client, guildId, channelId, game);
    return interaction.update({
      embeds: [
        buildC4Embed({
          title: 'Connect Four',
          description: [
            `<@${game.challengerId}> (${RED}) vs <@${game.opponentId}> (${YELLOW})`,
            'Click a column (1-7) to drop a piece.',
            renderC4Board(game.board),
            '',
            `<@${game.turn}> goes first.`,
          ].join('\n'),
        }),
      ],
      components: buildC4Components(game.board),
    });
  }

  if (id === 'c4_quit') {
    const canQuit =
      (game.mode === 'bot' && interaction.user.id === game.playerId) ||
      (game.mode === 'pvp' &&
        (interaction.user.id === game.challengerId ||
          interaction.user.id === game.opponentId));
    if (!canQuit) {
      return interaction.reply({
        embeds: [error('Only players can quit this game.')],
        ephemeral: true,
      });
    }
    clearC4Game(client, guildId, channelId);
    return interaction.update({
      embeds: [
        buildC4Embed({
          title: 'Connect Four',
          description: `${interaction.user} ended the game.`,
        }),
      ],
      components: [],
    });
  }

  if (id.startsWith('c4_drop:')) {
    if (game.status !== 'active') {
      return interaction.reply({
        embeds: [error('This game is not active yet.')],
        ephemeral: true,
      });
    }

    const col = Number(id.split(':')[1]);
    if (Number.isNaN(col) || col < 0 || col > 6) {
      return interaction.reply({
        embeds: [error('Invalid column.')],
        ephemeral: true,
      });
    }

    if (game.mode === 'bot') {
      if (interaction.user.id !== game.playerId) {
        return interaction.reply({
          embeds: [error('This is not your game.')],
          ephemeral: true,
        });
      }

      if (dropPiece(game.board, col, RED) < 0) {
        return interaction.reply({
          embeds: [error('That column is full.')],
          ephemeral: true,
        });
      }

      if (checkC4Winner(game.board, RED)) {
        clearC4Game(client, guildId, channelId);
        client.db.addFunStat(guildId, interaction.user.id, 'c4_wins');
        return interaction.update({
          embeds: [
            buildC4Embed({
              title: 'Connect Four — You win',
              description: [renderC4Board(game.board), '', 'You win!'].join('\n'),
            }),
          ],
          components: buildC4Components(game.board, { ended: true }),
        });
      }

      if (isBoardFull(game.board)) {
        clearC4Game(client, guildId, channelId);
        return interaction.update({
          embeds: [
            buildC4Embed({
              title: 'Connect Four — Draw',
              description: [renderC4Board(game.board), '', 'Draw.'].join('\n'),
            }),
          ],
          components: buildC4Components(game.board, { ended: true }),
        });
      }

      const botCol = c4BotMove(game.board, YELLOW, RED);
      if (botCol >= 0) dropPiece(game.board, botCol, YELLOW);

      if (checkC4Winner(game.board, YELLOW)) {
        clearC4Game(client, guildId, channelId);
        client.db.addFunStat(guildId, interaction.user.id, 'c4_losses');
        return interaction.update({
          embeds: [
            buildC4Embed({
              title: 'Connect Four — Bot wins',
              description: [renderC4Board(game.board), '', 'Bot wins.'].join('\n'),
            }),
          ],
          components: buildC4Components(game.board, { ended: true }),
        });
      }

      if (isBoardFull(game.board)) {
        clearC4Game(client, guildId, channelId);
        return interaction.update({
          embeds: [
            buildC4Embed({
              title: 'Connect Four — Draw',
              description: [renderC4Board(game.board), '', 'Draw.'].join('\n'),
            }),
          ],
          components: buildC4Components(game.board, { ended: true }),
        });
      }

      setC4Game(client, guildId, channelId, game);
      return interaction.update({
        embeds: [
          buildC4Embed({
            title: 'Connect Four',
            description: [
              `You are ${RED}, bot is ${YELLOW}.`,
              'Click a column (1-7) to drop a piece.',
              renderC4Board(game.board),
            ].join('\n'),
            footer: `${interaction.user.tag}'s turn`,
          }),
        ],
        components: buildC4Components(game.board),
      });
    }

    if (game.mode === 'pvp') {
      if (interaction.user.id !== game.turn) {
        return interaction.reply({
          embeds: [error('It is not your turn.')],
          ephemeral: true,
        });
      }

      const mark = game.marks[interaction.user.id];
      if (dropPiece(game.board, col, mark) < 0) {
        return interaction.reply({
          embeds: [error('That column is full.')],
          ephemeral: true,
        });
      }

      if (checkC4Winner(game.board, mark)) {
        clearC4Game(client, guildId, channelId);
        client.db.addFunStat(guildId, interaction.user.id, 'c4_wins');
        const loserId =
          interaction.user.id === game.challengerId
            ? game.opponentId
            : game.challengerId;
        client.db.addFunStat(guildId, loserId, 'c4_losses');
        return interaction.update({
          embeds: [
            buildC4Embed({
              title: 'Connect Four — Winner',
              description: [
                renderC4Board(game.board),
                '',
                `${interaction.user} wins!`,
              ].join('\n'),
            }),
          ],
          components: buildC4Components(game.board, { ended: true }),
        });
      }

      if (isBoardFull(game.board)) {
        clearC4Game(client, guildId, channelId);
        return interaction.update({
          embeds: [
            buildC4Embed({
              title: 'Connect Four — Draw',
              description: [renderC4Board(game.board), '', 'Draw.'].join('\n'),
            }),
          ],
          components: buildC4Components(game.board, { ended: true }),
        });
      }

      game.turn =
        game.turn === game.challengerId ? game.opponentId : game.challengerId;
      setC4Game(client, guildId, channelId, game);
      return interaction.update({
        embeds: [
          buildC4Embed({
            title: 'Connect Four',
            description: [
              `<@${game.challengerId}> (${RED}) vs <@${game.opponentId}> (${YELLOW})`,
              renderC4Board(game.board),
              '',
              `<@${game.turn}>'s turn. Click a column.`,
            ].join('\n'),
          }),
        ],
        components: buildC4Components(game.board),
      });
    }
  }
}

async function handleTtt(client, interaction) {
  if (!interaction.isButton()) return;
  if (!interaction.guild) return;

  const id = interaction.customId;
  if (
    id !== 'ttt_accept' &&
    id !== 'ttt_decline' &&
    id !== 'ttt_quit' &&
    !id.startsWith('ttt_cell:')
  ) {
    return;
  }

  const guildId = interaction.guild.id;
  const channelId = interaction.channel.id;
  const game = getTttGame(client, guildId, channelId);

  if (!game) {
    return interaction.reply({
      embeds: [error('No active tic-tac-toe game here.')],
      ephemeral: true,
    });
  }

  if (game.messageId && game.messageId !== interaction.message.id) {
    return interaction.reply({
      embeds: [error('This board is outdated. Use the latest game message.')],
      ephemeral: true,
    });
  }

  if (id === 'ttt_decline') {
    if (
      interaction.user.id !== game.opponentId &&
      interaction.user.id !== game.challengerId
    ) {
      return interaction.reply({
        embeds: [error('Only the challenged player can decline.')],
        ephemeral: true,
      });
    }
    clearTttGame(client, guildId, channelId);
    return interaction.update({
      embeds: [
        buildTttEmbed({
          title: 'Tic-Tac-Toe',
          description: 'Challenge declined.',
        }),
      ],
      components: [],
    });
  }

  if (id === 'ttt_accept') {
    if (game.mode !== 'pvp' || game.status !== 'pending') {
      return interaction.reply({
        embeds: [error('No pending challenge.')],
        ephemeral: true,
      });
    }
    if (interaction.user.id !== game.opponentId) {
      return interaction.reply({
        embeds: [error('Only the challenged player can accept.')],
        ephemeral: true,
      });
    }
    game.status = 'active';
    game.turn = game.challengerId;
    setTttGame(client, guildId, channelId, game);
    return interaction.update({
      embeds: [
        buildTttEmbed({
          title: 'Tic-Tac-Toe',
          description: [
            `<@${game.challengerId}> (**X**) vs <@${game.opponentId}> (**O**)`,
            renderBoard(game.board),
            '',
            `<@${game.turn}> goes first. Click a cell.`,
          ].join('\n'),
        }),
      ],
      components: buildTttComponents(game.board),
    });
  }

  if (id === 'ttt_quit') {
    const canQuit =
      (game.mode === 'bot' && interaction.user.id === game.playerId) ||
      (game.mode === 'pvp' &&
        (interaction.user.id === game.challengerId ||
          interaction.user.id === game.opponentId));
    if (!canQuit) {
      return interaction.reply({
        embeds: [error('Only players can quit this game.')],
        ephemeral: true,
      });
    }
    clearTttGame(client, guildId, channelId);
    return interaction.update({
      embeds: [
        buildTttEmbed({
          title: 'Tic-Tac-Toe',
          description: `${interaction.user} ended the game.`,
        }),
      ],
      components: [],
    });
  }

  if (id.startsWith('ttt_cell:')) {
    if (game.status !== 'active') {
      return interaction.reply({
        embeds: [error('This game is not active yet.')],
        ephemeral: true,
      });
    }

    const idx = Number(id.split(':')[1]);
    if (Number.isNaN(idx) || idx < 0 || idx > 8) {
      return interaction.reply({
        embeds: [error('Invalid cell.')],
        ephemeral: true,
      });
    }
    if (game.board[idx]) {
      return interaction.reply({
        embeds: [error('That cell is already taken.')],
        ephemeral: true,
      });
    }

    if (game.mode === 'bot') {
      if (interaction.user.id !== game.playerId) {
        return interaction.reply({
          embeds: [error('This is not your game.')],
          ephemeral: true,
        });
      }

      game.board[idx] = 'X';
      let result = checkTttWinner(game.board);
      if (result === 'X') {
        clearTttGame(client, guildId, channelId);
        client.db.addFunStat(guildId, interaction.user.id, 'ttt_wins');
        return interaction.update({
          embeds: [
            buildTttEmbed({
              title: 'Tic-Tac-Toe — You win',
              description: [renderBoard(game.board), '', 'You win!'].join('\n'),
            }),
          ],
          components: buildTttComponents(game.board, { ended: true }),
        });
      }
      if (result === 'tie') {
        clearTttGame(client, guildId, channelId);
        return interaction.update({
          embeds: [
            buildTttEmbed({
              title: 'Tic-Tac-Toe — Draw',
              description: [renderBoard(game.board), '', 'Draw.'].join('\n'),
            }),
          ],
          components: buildTttComponents(game.board, { ended: true }),
        });
      }

      const botIdx = botMove(game.board, 'O', 'X');
      if (botIdx >= 0) game.board[botIdx] = 'O';
      result = checkTttWinner(game.board);

      if (result === 'O') {
        clearTttGame(client, guildId, channelId);
        client.db.addFunStat(guildId, interaction.user.id, 'ttt_losses');
        return interaction.update({
          embeds: [
            buildTttEmbed({
              title: 'Tic-Tac-Toe — Bot wins',
              description: [renderBoard(game.board), '', 'Bot wins.'].join('\n'),
            }),
          ],
          components: buildTttComponents(game.board, { ended: true }),
        });
      }
      if (result === 'tie') {
        clearTttGame(client, guildId, channelId);
        return interaction.update({
          embeds: [
            buildTttEmbed({
              title: 'Tic-Tac-Toe — Draw',
              description: [renderBoard(game.board), '', 'Draw.'].join('\n'),
            }),
          ],
          components: buildTttComponents(game.board, { ended: true }),
        });
      }

      setTttGame(client, guildId, channelId, game);
      return interaction.update({
        embeds: [
          buildTttEmbed({
            title: 'Tic-Tac-Toe',
            description: [
              'You are **X**, bot is **O**.',
              renderBoard(game.board),
              '',
              'Your turn. Click a cell.',
            ].join('\n'),
            footer: `${interaction.user.tag}'s turn`,
          }),
        ],
        components: buildTttComponents(game.board),
      });
    }

    if (game.mode === 'pvp') {
      if (interaction.user.id !== game.turn) {
        return interaction.reply({
          embeds: [error('It is not your turn.')],
          ephemeral: true,
        });
      }

      const mark = game.marks[interaction.user.id];
      game.board[idx] = mark;
      const result = checkTttWinner(game.board);

      if (result === mark) {
        clearTttGame(client, guildId, channelId);
        client.db.addFunStat(guildId, interaction.user.id, 'ttt_wins');
        const loserId =
          interaction.user.id === game.challengerId
            ? game.opponentId
            : game.challengerId;
        client.db.addFunStat(guildId, loserId, 'ttt_losses');
        return interaction.update({
          embeds: [
            buildTttEmbed({
              title: 'Tic-Tac-Toe — Winner',
              description: [
                renderBoard(game.board),
                '',
                `${interaction.user} wins!`,
              ].join('\n'),
            }),
          ],
          components: buildTttComponents(game.board, { ended: true }),
        });
      }

      if (result === 'tie') {
        clearTttGame(client, guildId, channelId);
        return interaction.update({
          embeds: [
            buildTttEmbed({
              title: 'Tic-Tac-Toe — Draw',
              description: [renderBoard(game.board), '', 'Draw.'].join('\n'),
            }),
          ],
          components: buildTttComponents(game.board, { ended: true }),
        });
      }

      game.turn =
        game.turn === game.challengerId ? game.opponentId : game.challengerId;
      setTttGame(client, guildId, channelId, game);
      return interaction.update({
        embeds: [
          buildTttEmbed({
            title: 'Tic-Tac-Toe',
            description: [
              `<@${game.challengerId}> (**X**) vs <@${game.opponentId}> (**O**)`,
              renderBoard(game.board),
              '',
              `<@${game.turn}>'s turn. Click a cell.`,
            ].join('\n'),
          }),
        ],
        components: buildTttComponents(game.board),
      });
    }
  }
}

async function handleHelp(client, interaction) {
  const [action, ownerId] = interaction.customId.split(':');
  if (!['help_select', 'help_home', 'help_close'].includes(action)) return false;

  if (interaction.user.id !== ownerId) {
    await interaction.reply({
      embeds: [error('Only the command author can use this menu.')],
      ephemeral: true,
    });
    return true;
  }

  const prefix = client.db.getPrefix(interaction.guild.id);

  if (action === 'help_close') {
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setDescription('Menu closed. Run `+help` to open it again.'),
      ],
      components: [],
    });
    return true;
  }

  if (action === 'help_home') {
    await interaction.update({
      embeds: [buildHomeEmbed(client, interaction.user, prefix)],
      components: buildHelpComponents(client, interaction.user.id),
    });
    return true;
  }

  const categoryId = interaction.values[0];
  await interaction.update({
    embeds: [buildCategoryEmbed(client, interaction.user, prefix, categoryId)],
    components: buildHelpComponents(client, interaction.user.id, categoryId),
  });
  return true;
}

async function handleGiveawayEnter(client, interaction) {
  const giveaway = client.db.getGiveaway(interaction.message.id);
  if (!giveaway || giveaway.ended || giveaway.cancelled) {
    return interaction.reply({
      embeds: [error('This giveaway is no longer active.')],
      ephemeral: true,
    });
  }

  const guildData = client.db.ensureGuild(interaction.guild.id);
  const settings = getGiveawaySettings(guildData, giveaway);
  const fail = checkEligibility(interaction.member, settings);
  if (fail) {
    return interaction.reply({ embeds: [error(fail)], ephemeral: true });
  }

  const map = parseEntryMap(giveaway.entries);
  if (map[interaction.user.id]) {
    return interaction.reply({
      embeds: [info('You are already entered. Use **Leave** to withdraw first.')],
      ephemeral: true,
    });
  }

  map[interaction.user.id] = entryWeight(interaction.member, settings);
  client.db.updateGiveaway(interaction.message.id, { entries: map });
  await refreshGiveawayMessage(client, interaction.message.id);

  const stats = entryStats(map);
  return interaction.reply({
    embeds: [
      success(
        `You entered the giveaway with **${map[interaction.user.id]}** entry/entries.\nTotal entries: **${stats.entries}** (${stats.participants} participants).`
      ),
    ],
    ephemeral: true,
  });
}

async function handleGiveawayLeave(client, interaction) {
  const giveaway = client.db.getGiveaway(interaction.message.id);
  if (!giveaway || giveaway.ended || giveaway.cancelled) {
    return interaction.reply({
      embeds: [error('This giveaway is no longer active.')],
      ephemeral: true,
    });
  }

  const map = parseEntryMap(giveaway.entries);
  if (!map[interaction.user.id]) {
    return interaction.reply({
      embeds: [info('You are not entered in this giveaway.')],
      ephemeral: true,
    });
  }

  delete map[interaction.user.id];
  client.db.updateGiveaway(interaction.message.id, { entries: map });
  await refreshGiveawayMessage(client, interaction.message.id);

  const stats = entryStats(map);
  return interaction.reply({
    embeds: [
      success(
        `You left the giveaway.\nTotal entries: **${stats.entries}** (${stats.participants} participants).`
      ),
    ],
    ephemeral: true,
  });
}

async function handleGiveawayCreate(client, interaction) {
  const guildData = client.db.ensureGuild(interaction.guild.id);
  if (!hasLevel(interaction.member, 'admin', guildData, client.config.ownerIds)) {
    return interaction.reply({
      embeds: [error('Admin permission required.')],
      ephemeral: true,
    });
  }

  const refreshMenu = async (draft, ownerId) => {
    if (!interaction.message?.editable) return;
    await interaction.message.edit({
      embeds: [buildGiveawayCreateEmbed(interaction.guild, draft)],
      components: giveawayCreateMenu(ownerId),
    });
  };

  const getOrCreateDraft = (ownerId) => {
    let draft = getDraft(client, interaction.guild.id, ownerId);
    if (!draft) {
      draft = defaultDraft(interaction.channel?.id);
      setDraft(client, interaction.guild.id, ownerId, draft);
    }
    return draft;
  };

  if (interaction.isModalSubmit()) {
    const ownerId = interaction.user.id;
    const draft = getOrCreateDraft(ownerId);

    if (interaction.customId === 'gcreate_prize_modal') {
      const prize = interaction.fields.getTextInputValue('prize').trim();
      if (!prize) {
        return interaction.reply({
          embeds: [error('Prize cannot be empty.')],
          ephemeral: true,
        });
      }
      draft.prize = prize.slice(0, 256);
      setDraft(client, interaction.guild.id, ownerId, draft);
      await interaction.reply({
        embeds: [success(`Prize set to **${draft.prize}**.`)],
        ephemeral: true,
      });
      return refreshMenu(draft, ownerId);
    }

    if (interaction.customId === 'gcreate_duration_modal') {
      const duration = interaction.fields.getTextInputValue('duration').trim();
      if (!parseDuration(duration)) {
        return interaction.reply({
          embeds: [error('Invalid duration (e.g. `1h`, `2d`, `30m`).')],
          ephemeral: true,
        });
      }
      draft.duration = duration;
      setDraft(client, interaction.guild.id, ownerId, draft);
      await interaction.reply({
        embeds: [success(`Duration set to **${duration}**.`)],
        ephemeral: true,
      });
      return refreshMenu(draft, ownerId);
    }

    if (interaction.customId === 'gcreate_winners_modal') {
      const winners = Math.floor(
        Number(interaction.fields.getTextInputValue('winners'))
      );
      if (!winners || winners < 1) {
        return interaction.reply({
          embeds: [error('Winners must be a number >= 1.')],
          ephemeral: true,
        });
      }
      draft.winners = winners;
      setDraft(client, interaction.guild.id, ownerId, draft);
      await interaction.reply({
        embeds: [success(`Winners set to **${winners}**.`)],
        ephemeral: true,
      });
      return refreshMenu(draft, ownerId);
    }

    if (interaction.customId === 'gcreate_min_age_modal') {
      const days = Number(interaction.fields.getTextInputValue('days'));
      if (Number.isNaN(days) || days < 0) {
        return interaction.reply({
          embeds: [error('Days must be a number >= 0.')],
          ephemeral: true,
        });
      }
      draft.minAccountDays = days;
      setDraft(client, interaction.guild.id, ownerId, draft);
      await interaction.reply({
        embeds: [success(`Minimum account age set to **${days}** day(s).`)],
        ephemeral: true,
      });
      return refreshMenu(draft, ownerId);
    }

    if (interaction.customId === 'gcreate_bonus_entries_modal') {
      const amount = Number(interaction.fields.getTextInputValue('amount'));
      if (Number.isNaN(amount) || amount < 0) {
        return interaction.reply({
          embeds: [error('Amount must be a number >= 0.')],
          ephemeral: true,
        });
      }
      draft.bonusEntries = amount;
      setDraft(client, interaction.guild.id, ownerId, draft);
      await interaction.reply({
        embeds: [success(`Bonus entries set to **+${amount}**.`)],
        ephemeral: true,
      });
      return refreshMenu(draft, ownerId);
    }
    return;
  }

  const parts = interaction.customId.split(':');
  const action = parts[0];
  const ownerId =
    action === 'gcreate_role' ? parts[2] : parts[1];

  if (!assertGiveawayCreateOwner(interaction, ownerId)) {
    return interaction.reply({
      embeds: [error('Only the command author can use this menu.')],
      ephemeral: true,
    });
  }

  const draft = getOrCreateDraft(ownerId);

  if (action === 'gcreate_close') {
    clearDraft(client, interaction.guild.id, ownerId);
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setDescription('Giveaway creator closed. Run `+gcreate` to start again.'),
      ],
      components: [],
    });
  }

  if (action === 'gcreate_back') {
    return interaction.update({
      embeds: [buildGiveawayCreateEmbed(interaction.guild, draft)],
      components: giveawayCreateMenu(ownerId),
    });
  }

  if (action === 'gcreate_menu' && interaction.isStringSelectMenu()) {
    const choice = interaction.values[0];

    if (choice === 'prize') {
      return interaction.showModal(giveawayPrizeModal(draft));
    }

    if (choice === 'duration') {
      return interaction.showModal(giveawayDurationModal(draft));
    }

    if (choice === 'winners') {
      return interaction.showModal(giveawayWinnersModal(draft));
    }

    if (choice === 'channel') {
      return interaction.update({
        embeds: [
          giveawayCreatePickerEmbed(
            'Post channel',
            'Choose where the giveaway will be published.'
          ),
        ],
        components: giveawayCreateChannelPicker(ownerId),
      });
    }

    if (choice === 'required_role') {
      return interaction.update({
        embeds: [
          giveawayCreatePickerEmbed(
            'Required role',
            'Members need this role to enter.'
          ),
        ],
        components: giveawayCreateRolePicker(ownerId, 'required'),
      });
    }

    if (choice === 'bonus_role') {
      return interaction.update({
        embeds: [
          giveawayCreatePickerEmbed(
            'Bonus role',
            'Members with this role receive extra entries.'
          ),
        ],
        components: giveawayCreateRolePicker(ownerId, 'bonus'),
      });
    }

    if (choice === 'min_age') {
      return interaction.showModal(giveawayCreateMinAgeModal(draft));
    }

    if (choice === 'bonus_entries') {
      return interaction.showModal(giveawayCreateBonusModal(draft));
    }

    if (choice === 'boosters') {
      draft.boostersOnly = !draft.boostersOnly;
      setDraft(client, interaction.guild.id, ownerId, draft);
      return interaction.update({
        embeds: [buildGiveawayCreateEmbed(interaction.guild, draft)],
        components: giveawayCreateMenu(ownerId),
      });
    }

    if (choice === 'ping') {
      draft.pingOnEnd = !draft.pingOnEnd;
      setDraft(client, interaction.guild.id, ownerId, draft);
      return interaction.update({
        embeds: [buildGiveawayCreateEmbed(interaction.guild, draft)],
        components: giveawayCreateMenu(ownerId),
      });
    }

    if (choice === 'clear_required') {
      draft.requiredRole = null;
      setDraft(client, interaction.guild.id, ownerId, draft);
      return interaction.update({
        embeds: [buildGiveawayCreateEmbed(interaction.guild, draft)],
        components: giveawayCreateMenu(ownerId),
      });
    }

    if (choice === 'clear_bonus') {
      draft.bonusRole = null;
      draft.bonusEntries = 0;
      setDraft(client, interaction.guild.id, ownerId, draft);
      return interaction.update({
        embeds: [buildGiveawayCreateEmbed(interaction.guild, draft)],
        components: giveawayCreateMenu(ownerId),
      });
    }

    if (choice === 'post') {
      await interaction.deferUpdate();
      const result = await postGiveaway(
        client,
        interaction.guild,
        draft,
        interaction.user
      );

      if (result.error) {
        await interaction.editReply({
          embeds: [buildGiveawayCreateEmbed(interaction.guild, draft)],
          components: giveawayCreateMenu(ownerId),
        });
        return interaction.followUp({
          embeds: [error(result.error)],
          ephemeral: true,
        });
      }

      clearDraft(client, interaction.guild.id, ownerId);
      return interaction.editReply({
        embeds: [
          success(
            [
              `Giveaway posted in ${result.channel}.`,
              `Message: ${result.message.url}`,
            ].join('\n'),
            'Giveaway created'
          ),
        ],
        components: [],
      });
    }
  }

  if (action === 'gcreate_role' && interaction.isRoleSelectMenu()) {
    const field = parts[1];
    const role = interaction.roles.first();
    if (field === 'required') draft.requiredRole = role.id;
    if (field === 'bonus') draft.bonusRole = role.id;
    setDraft(client, interaction.guild.id, ownerId, draft);
    await interaction.update({
      embeds: [buildGiveawayCreateEmbed(interaction.guild, draft)],
      components: giveawayCreateMenu(ownerId),
    });
    return interaction.followUp({
      embeds: [success(`Set ${field} role to ${role}.`)],
      ephemeral: true,
    });
  }

  if (action === 'gcreate_channel' && interaction.isChannelSelectMenu()) {
    const channel = interaction.channels.first();
    draft.channelId = channel.id;
    setDraft(client, interaction.guild.id, ownerId, draft);
    await interaction.update({
      embeds: [buildGiveawayCreateEmbed(interaction.guild, draft)],
      components: giveawayCreateMenu(ownerId),
    });
    return interaction.followUp({
      embeds: [success(`Giveaway will post in ${channel}.`)],
      ephemeral: true,
    });
  }
}

async function requireTicketStaff(client, interaction) {
  const g = client.db.ensureGuild(interaction.guild.id);
  if (!isTicketStaff(interaction.member, g, client.config.ownerIds)) {
    await interaction.reply({
      embeds: [error('Only staff can use this.')],
      ephemeral: true,
    });
    return false;
  }
  return true;
}

async function handleTicketInteractions(client, interaction) {
  const id = interaction.customId;

  // Open from panel
  if (interaction.isButton() && id === 'ticket_open') {
    await interaction.deferReply({ ephemeral: true });
    return openTicket(client, interaction);
  }

  // Staff controls inside ticket
  if (interaction.isButton() && id === 'ticket_close') {
    if (!(await requireTicketStaff(client, interaction))) return;
    const ticket = client.db.getTicket(interaction.channel.id);
    if (!ticket || ticket.closed) {
      return interaction.reply({
        embeds: [error('This is not an open ticket.')],
        ephemeral: true,
      });
    }
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(withEmoji('tickets', 'Close ticket?'))
          .setDescription('Confirm to close, generate transcript, then delete this channel.'),
      ],
      components: closeConfirmComponents(),
      ephemeral: true,
    });
  }

  if (interaction.isButton() && id === 'ticket_close_cancel') {
    return interaction.update({
      embeds: [info('Close cancelled.')],
      components: [],
    });
  }

  if (interaction.isButton() && id === 'ticket_close_confirm') {
    return finalizeClose(client, interaction, null);
  }

  if (interaction.isButton() && id === 'ticket_close_reason') {
    if (!(await requireTicketStaff(client, interaction))) return;
    const modal = new ModalBuilder()
      .setCustomId('ticket_close_modal')
      .setTitle('Close ticket')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Reason (optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(500)
        )
      );
    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && id === 'ticket_close_modal') {
    const reason = interaction.fields.getTextInputValue('reason')?.trim() || null;
    return finalizeClose(client, interaction, reason);
  }

  if (interaction.isButton() && id === 'ticket_transcript') {
    return sendStandaloneTranscript(client, interaction);
  }

  if (interaction.isButton() && id === 'ticket_add') {
    if (!(await requireTicketStaff(client, interaction))) return;
    return interaction.reply({
      embeds: [info('Select a user to add to this ticket.')],
      components: [userSelectRow('ticket_add_select', 'Select user to add')],
      ephemeral: true,
    });
  }

  if (interaction.isButton() && id === 'ticket_remove') {
    if (!(await requireTicketStaff(client, interaction))) return;
    return interaction.reply({
      embeds: [info('Select a user to remove from this ticket.')],
      components: [userSelectRow('ticket_remove_select', 'Select user to remove')],
      ephemeral: true,
    });
  }

  if (interaction.isUserSelectMenu() && id === 'ticket_add_select') {
    if (!(await requireTicketStaff(client, interaction))) return;
    const ticket = client.db.getTicket(interaction.channel.id);
    if (!ticket || ticket.closed) {
      return interaction.update({
        embeds: [error('This is not an open ticket.')],
        components: [],
      });
    }

    const user = interaction.users.first();
    if (!user || user.bot) {
      return interaction.update({
        embeds: [error('Invalid user.')],
        components: [],
      });
    }

    await interaction.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
      AttachFiles: true,
      ReadMessageHistory: true,
    });

    await interaction.channel
      .send({ embeds: [success(`${user} was added to the ticket by ${interaction.user}.`)] })
      .catch(() => null);

    return interaction.update({
      embeds: [success(`${user} added.`)],
      components: [],
    });
  }

  if (interaction.isUserSelectMenu() && id === 'ticket_remove_select') {
    if (!(await requireTicketStaff(client, interaction))) return;
    const ticket = client.db.getTicket(interaction.channel.id);
    if (!ticket || ticket.closed) {
      return interaction.update({
        embeds: [error('This is not an open ticket.')],
        components: [],
      });
    }

    const user = interaction.users.first();
    if (!user) {
      return interaction.update({
        embeds: [error('Invalid user.')],
        components: [],
      });
    }
    if (user.id === ticket.user_id) {
      return interaction.update({
        embeds: [error('You cannot remove the ticket author.')],
        components: [],
      });
    }
    if (user.id === client.user.id) {
      return interaction.update({
        embeds: [error('You cannot remove the bot.')],
        components: [],
      });
    }

    await interaction.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: false,
    });

    await interaction.channel
      .send({ embeds: [success(`${user} was removed from the ticket by ${interaction.user}.`)] })
      .catch(() => null);

    return interaction.update({
      embeds: [success(`${user} removed.`)],
      components: [],
    });
  }

  return false;
}

async function handleTicketSetup(client, interaction) {
  const [action, ownerId] = interaction.customId.split(':');
  if (!assertOwner(interaction, ownerId)) {
    return interaction.reply({
      embeds: [error('Only the command author can use this menu.')],
      ephemeral: true,
    });
  }

  const guildData = client.db.ensureGuild(interaction.guild.id);
  if (!hasLevel(interaction.member, 'admin', guildData, client.config.ownerIds)) {
    return interaction.reply({
      embeds: [error('Admin permission required.')],
      ephemeral: true,
    });
  }

  if (action === 'tsetup_close') {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setDescription('Ticket setup closed. Run `+ticketsetup` to open it again.'),
      ],
      components: [],
    });
  }

  if (action === 'tsetup_back') {
    const data = client.db.ensureGuild(interaction.guild.id);
    return interaction.update({
      embeds: [buildSetupEmbed(interaction.guild, data)],
      components: mainMenu(ownerId),
    });
  }

  if (action === 'tsetup_menu' && interaction.isStringSelectMenu()) {
    const choice = interaction.values[0];

    if (choice === 'category') {
      return interaction.update({
        embeds: [
          pickerEmbed(
            'Select category',
            'Choose the category where ticket channels will be created.'
          ),
        ],
        components: categoryPicker(ownerId),
      });
    }

    if (choice === 'support') {
      return interaction.update({
        embeds: [
          pickerEmbed(
            'Select support role',
            'Choose the role that can see and manage tickets.'
          ),
        ],
        components: supportPicker(ownerId),
      });
    }

    if (choice === 'logs') {
      return interaction.update({
        embeds: [
          pickerEmbed(
            'Select log channel',
            'Choose where open / close / delete logs are sent.'
          ),
        ],
        components: logsPicker(ownerId),
      });
    }

    if (choice === 'clear_logs') {
      client.db.updateGuild(interaction.guild.id, { ticket_log: null });
      const data = client.db.ensureGuild(interaction.guild.id);
      return interaction.update({
        embeds: [buildSetupEmbed(interaction.guild, data)],
        components: mainMenu(ownerId),
      });
    }

    if (choice === 'panel') {
      const data = client.db.ensureGuild(interaction.guild.id);
      if (!data.ticket_category || !data.ticket_support_role) {
        return interaction.reply({
          embeds: [
            error(
              'Set **Category** and **Support role** before posting the panel.'
            ),
          ],
          ephemeral: true,
        });
      }

      return interaction.update({
        embeds: [
          pickerEmbed(
            'Post panel',
            'Choose the channel where the public ticket panel will be posted.'
          ),
        ],
        components: panelPicker(ownerId),
      });
    }
  }

  if (action === 'tsetup_category' && interaction.isChannelSelectMenu()) {
    const channel = interaction.channels.first();
    client.db.updateGuild(interaction.guild.id, {
      ticket_category: channel.id,
    });
    const data = client.db.ensureGuild(interaction.guild.id);
    return interaction.update({
      embeds: [buildSetupEmbed(interaction.guild, data)],
      components: mainMenu(ownerId),
    });
  }

  if (action === 'tsetup_support' && interaction.isRoleSelectMenu()) {
    const role = interaction.roles.first();
    client.db.updateGuild(interaction.guild.id, {
      ticket_support_role: role.id,
    });
    const data = client.db.ensureGuild(interaction.guild.id);
    return interaction.update({
      embeds: [buildSetupEmbed(interaction.guild, data)],
      components: mainMenu(ownerId),
    });
  }

  if (action === 'tsetup_logs' && interaction.isChannelSelectMenu()) {
    const channel = interaction.channels.first();
    client.db.updateGuild(interaction.guild.id, {
      ticket_log: channel.id,
    });
    const data = client.db.ensureGuild(interaction.guild.id);
    return interaction.update({
      embeds: [buildSetupEmbed(interaction.guild, data)],
      components: mainMenu(ownerId),
    });
  }

  if (action === 'tsetup_panel' && interaction.isChannelSelectMenu()) {
    const channel = interaction.channels.first();
    const data = client.db.ensureGuild(interaction.guild.id);

    if (!data.ticket_category || !data.ticket_support_role) {
      return interaction.update({
        embeds: [buildSetupEmbed(interaction.guild, data)],
        components: mainMenu(ownerId),
      }).then(() =>
        interaction.followUp({
          embeds: [
            error('Set **Category** and **Support role** before posting the panel.'),
          ],
          ephemeral: true,
        })
      );
    }

    try {
      await postPanel(interaction.guild, channel, data);
    } catch (err) {
      console.error('[ticketsetup:panel]', err);
      return interaction.update({
        embeds: [buildSetupEmbed(interaction.guild, data)],
        components: mainMenu(ownerId),
      }).then(() =>
        interaction.followUp({
          embeds: [error('Failed to post the panel. Check my permissions in that channel.')],
          ephemeral: true,
        })
      );
    }

    await interaction.update({
      embeds: [buildSetupEmbed(interaction.guild, data)],
      components: mainMenu(ownerId),
    });

    return interaction.followUp({
      embeds: [success(`Panel posted in ${channel}.`)],
      ephemeral: true,
    });
  }
}

async function ensureConfigAdmin(client, interaction) {
  const guildData = client.db.ensureGuild(interaction.guild.id);
  if (!hasLevel(interaction.member, 'admin', guildData, client.config.ownerIds)) {
    await interaction.reply({
      embeds: [error('Admin permission required.')],
      ephemeral: true,
    });
    return null;
  }
  return guildData;
}

async function handleWelcomeSetup(client, interaction) {
  if (interaction.isModalSubmit() && interaction.customId === 'wsetup_message_modal') {
    if (!(await ensureConfigAdmin(client, interaction))) return;
    const text = interaction.fields.getTextInputValue('welcome_message').trim();
    if (!text) {
      return interaction.reply({
        embeds: [error('Message cannot be empty.')],
        ephemeral: true,
      });
    }
    client.db.updateGuild(interaction.guild.id, { welcome_message: text });
    const data = client.db.ensureGuild(interaction.guild.id);
    return interaction.update({
      embeds: [buildWelcomeEmbed(interaction.guild, data)],
      components: welcomeMainMenu(interaction.user.id),
    }).catch(async () => {
      await interaction.reply({
        embeds: [success('Welcome message updated.')],
        ephemeral: true,
      });
    });
  }

  const [action, ownerId] = interaction.customId.split(':');
  if (!assertWelcomeOwner(interaction, ownerId)) {
    return interaction.reply({
      embeds: [error('Only the command author can use this menu.')],
      ephemeral: true,
    });
  }
  if (!(await ensureConfigAdmin(client, interaction))) return;

  if (action === 'wsetup_close') {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setDescription('Welcome setup closed. Run `+setwelcome` to open it again.'),
      ],
      components: [],
    });
  }

  if (action === 'wsetup_back') {
    const data = client.db.ensureGuild(interaction.guild.id);
    return interaction.update({
      embeds: [buildWelcomeEmbed(interaction.guild, data)],
      components: welcomeMainMenu(ownerId),
    });
  }

  if (action === 'wsetup_menu' && interaction.isStringSelectMenu()) {
    const choice = interaction.values[0];

    if (choice === 'channel') {
      return interaction.update({
        embeds: [
          welcomePickerEmbed(
            'Select welcome channel',
            'Choose where welcome messages are sent.'
          ),
        ],
        components: welcomeChannelPicker(ownerId),
      });
    }

    if (choice === 'message') {
      const data = client.db.ensureGuild(interaction.guild.id);
      return interaction.showModal(welcomeMessageModal(data));
    }

    if (choice === 'preview') {
      const data = client.db.ensureGuild(interaction.guild.id);
      await interaction.update({
        embeds: [buildWelcomeEmbed(interaction.guild, data)],
        components: welcomeMainMenu(ownerId),
      });
      return interaction.followUp({
        embeds: [buildWelcomePreview(interaction.member, data)],
        ephemeral: true,
      });
    }

    if (choice === 'disable') {
      client.db.updateGuild(interaction.guild.id, { welcome_channel: null });
      const data = client.db.ensureGuild(interaction.guild.id);
      return interaction.update({
        embeds: [buildWelcomeEmbed(interaction.guild, data)],
        components: welcomeMainMenu(ownerId),
      });
    }

    if (choice === 'reset') {
      resetWelcome(client.db, interaction.guild.id);
      const data = client.db.ensureGuild(interaction.guild.id);
      await interaction.update({
        embeds: [buildWelcomeEmbed(interaction.guild, data)],
        components: welcomeMainMenu(ownerId),
      });
      return interaction.followUp({
        embeds: [success('Welcome settings reset to defaults.')],
        ephemeral: true,
      });
    }
  }

  if (action === 'wsetup_channel' && interaction.isChannelSelectMenu()) {
    const channel = interaction.channels.first();
    client.db.updateGuild(interaction.guild.id, {
      welcome_channel: channel.id,
    });
    const data = client.db.ensureGuild(interaction.guild.id);
    return interaction.update({
      embeds: [buildWelcomeEmbed(interaction.guild, data)],
      components: welcomeMainMenu(ownerId),
    });
  }
}

async function handleLeaveSetup(client, interaction) {
  if (interaction.isModalSubmit() && interaction.customId === 'lsetup_message_modal') {
    if (!(await ensureConfigAdmin(client, interaction))) return;
    const text = interaction.fields.getTextInputValue('leave_message').trim();
    if (!text) {
      return interaction.reply({
        embeds: [error('Message cannot be empty.')],
        ephemeral: true,
      });
    }
    client.db.updateGuild(interaction.guild.id, { leave_message: text });
    const data = client.db.ensureGuild(interaction.guild.id);
    return interaction.update({
      embeds: [buildLeaveEmbed(interaction.guild, data)],
      components: leaveMainMenu(interaction.user.id),
    }).catch(async () => {
      await interaction.reply({
        embeds: [success('Leave message updated.')],
        ephemeral: true,
      });
    });
  }

  const [action, ownerId] = interaction.customId.split(':');
  if (!assertLeaveOwner(interaction, ownerId)) {
    return interaction.reply({
      embeds: [error('Only the command author can use this menu.')],
      ephemeral: true,
    });
  }
  if (!(await ensureConfigAdmin(client, interaction))) return;

  if (action === 'lsetup_close') {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setDescription('Leave setup closed. Run `+setleave` to open it again.'),
      ],
      components: [],
    });
  }

  if (action === 'lsetup_back') {
    const data = client.db.ensureGuild(interaction.guild.id);
    return interaction.update({
      embeds: [buildLeaveEmbed(interaction.guild, data)],
      components: leaveMainMenu(ownerId),
    });
  }

  if (action === 'lsetup_menu' && interaction.isStringSelectMenu()) {
    const choice = interaction.values[0];

    if (choice === 'channel') {
      return interaction.update({
        embeds: [
          leavePickerEmbed(
            'Select leave channel',
            'Choose where leave messages are sent.'
          ),
        ],
        components: leaveChannelPicker(ownerId),
      });
    }

    if (choice === 'message') {
      const data = client.db.ensureGuild(interaction.guild.id);
      return interaction.showModal(leaveMessageModal(data));
    }

    if (choice === 'preview') {
      const data = client.db.ensureGuild(interaction.guild.id);
      await interaction.update({
        embeds: [buildLeaveEmbed(interaction.guild, data)],
        components: leaveMainMenu(ownerId),
      });
      return interaction.followUp({
        embeds: [buildLeavePreview(interaction.member, data)],
        ephemeral: true,
      });
    }

    if (choice === 'disable') {
      client.db.updateGuild(interaction.guild.id, { leave_channel: null });
      const data = client.db.ensureGuild(interaction.guild.id);
      return interaction.update({
        embeds: [buildLeaveEmbed(interaction.guild, data)],
        components: leaveMainMenu(ownerId),
      });
    }

    if (choice === 'reset') {
      resetLeave(client.db, interaction.guild.id);
      const data = client.db.ensureGuild(interaction.guild.id);
      await interaction.update({
        embeds: [buildLeaveEmbed(interaction.guild, data)],
        components: leaveMainMenu(ownerId),
      });
      return interaction.followUp({
        embeds: [success('Leave settings reset to defaults.')],
        ephemeral: true,
      });
    }
  }

  if (action === 'lsetup_channel' && interaction.isChannelSelectMenu()) {
    const channel = interaction.channels.first();
    client.db.updateGuild(interaction.guild.id, {
      leave_channel: channel.id,
    });
    const data = client.db.ensureGuild(interaction.guild.id);
    return interaction.update({
      embeds: [buildLeaveEmbed(interaction.guild, data)],
      components: leaveMainMenu(ownerId),
    });
  }
}

async function handleAutomodSetup(client, interaction) {
  if (interaction.isModalSubmit()) {
    if (!(await ensureConfigAdmin(client, interaction))) return;

    if (interaction.customId === 'asetup_badword_modal') {
      const word = interaction.fields
        .getTextInputValue('badword')
        .trim()
        .toLowerCase();
      if (!word) {
        return interaction.reply({
          embeds: [error('Provide a word.')],
          ephemeral: true,
        });
      }
      const current = client.db.ensureGuild(interaction.guild.id);
      const words = parseJsonArray(current.badwords);
      if (!words.includes(word)) words.push(word);
      client.db.updateGuild(interaction.guild.id, {
        badwords: JSON.stringify(words),
        automod_badwords: 1,
      });
      const data = client.db.ensureGuild(interaction.guild.id);
      return interaction.update({
        embeds: [buildAutomodEmbed(interaction.guild, data)],
        components: automodMainMenu(interaction.user.id),
      }).catch(async () => {
        await interaction.reply({
          embeds: [success(`Added: \`${word}\``)],
          ephemeral: true,
        });
      });
    }

    if (interaction.customId === 'asetup_timeout_modal') {
      const raw = interaction.fields.getTextInputValue('timeout_seconds').trim();
      const seconds = Number.parseInt(raw, 10);
      if (!Number.isFinite(seconds) || seconds < 5 || seconds > 600) {
        return interaction.reply({
          embeds: [error('Enter a number between 5 and 600.')],
          ephemeral: true,
        });
      }
      client.db.updateGuild(interaction.guild.id, {
        automod_timeout_seconds: seconds,
      });
      const data = client.db.ensureGuild(interaction.guild.id);
      return interaction.update({
        embeds: [buildAutomodEmbed(interaction.guild, data)],
        components: automodMainMenu(interaction.user.id),
      }).catch(async () => {
        await interaction.reply({
          embeds: [success(`Timeout duration set to ${seconds}s.`)],
          ephemeral: true,
        });
      });
    }
  }

  const parts = interaction.customId.split(':');
  const action = parts[0];
  const ownerId = parts[1];

  if (!assertAutomodOwner(interaction, ownerId)) {
    return interaction.reply({
      embeds: [error('Only the command author can use this menu.')],
      ephemeral: true,
    });
  }
  if (!(await ensureConfigAdmin(client, interaction))) return;

  const refresh = () => {
    const data = client.db.ensureGuild(interaction.guild.id);
    return interaction.update({
      embeds: [buildAutomodEmbed(interaction.guild, data)],
      components: automodMainMenu(ownerId),
    });
  };

  if (action === 'asetup_close') {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setDescription('Automod setup closed. Run `+automod` to open it again.'),
      ],
      components: [],
    });
  }

  if (action === 'asetup_back') {
    return refresh();
  }

  if (action === 'asetup_menu' && interaction.isStringSelectMenu()) {
    const choice = interaction.values[0];
    const data = client.db.ensureGuild(interaction.guild.id);

    if (choice === 'toggle_antilink') {
      client.db.updateGuild(interaction.guild.id, {
        automod_antilink: data.automod_antilink ? 0 : 1,
      });
      return refresh();
    }
    if (choice === 'toggle_antispam') {
      client.db.updateGuild(interaction.guild.id, {
        automod_antispam: data.automod_antispam ? 0 : 1,
      });
      return refresh();
    }
    if (choice === 'toggle_badwords') {
      client.db.updateGuild(interaction.guild.id, {
        automod_badwords: data.automod_badwords ? 0 : 1,
      });
      return refresh();
    }
    if (choice === 'toggle_log') {
      client.db.updateGuild(interaction.guild.id, {
        automod_log: data.automod_log ? 0 : 1,
      });
      return refresh();
    }

    if (choice === 'punish_antilink') {
      return interaction.update({
        embeds: [
          automodPickerEmbed(
            'Anti-link punishment',
            'Choose what happens when a link is posted.'
          ),
        ],
        components: punishPicker(ownerId, 'antilink', [
          { label: 'Delete', value: 'delete', description: 'Delete the message' },
          { label: 'Warn', value: 'warn', description: 'Delete and warn the user' },
          { label: 'Timeout', value: 'timeout', description: 'Delete and timeout' },
        ]),
      });
    }

    if (choice === 'punish_antispam') {
      return interaction.update({
        embeds: [
          automodPickerEmbed(
            'Anti-spam punishment',
            'Choose what happens when spam is detected.'
          ),
        ],
        components: punishPicker(ownerId, 'antispam', [
          { label: 'Warn', value: 'warn', description: 'Warn the user' },
          { label: 'Timeout', value: 'timeout', description: 'Timeout the user' },
        ]),
      });
    }

    if (choice === 'punish_badwords') {
      return interaction.update({
        embeds: [
          automodPickerEmbed(
            'Bad words punishment',
            'Choose what happens when a banned word is used.'
          ),
        ],
        components: punishPicker(ownerId, 'badwords', [
          { label: 'Delete', value: 'delete', description: 'Delete the message' },
          { label: 'Warn', value: 'warn', description: 'Delete and warn the user' },
          { label: 'Timeout', value: 'timeout', description: 'Delete and timeout' },
        ]),
      });
    }

    if (choice === 'ignore_channels') {
      return interaction.update({
        embeds: [
          automodPickerEmbed(
            'Ignore channels',
            'Select channels where automod should not run. Leave empty and submit to clear.'
          ),
        ],
        components: ignoreChannelPicker(ownerId),
      });
    }

    if (choice === 'ignore_roles') {
      return interaction.update({
        embeds: [
          automodPickerEmbed(
            'Ignore roles',
            'Select roles skipped by automod. Leave empty and submit to clear.'
          ),
        ],
        components: ignoreRolePicker(ownerId),
      });
    }

    if (choice === 'timeout_seconds') {
      return interaction.showModal(timeoutModal(data));
    }

    if (choice === 'badwords') {
      return interaction.update({
        embeds: [
          automodPickerEmbed(
            'Bad words',
            'Add, remove, list, or clear banned words.'
          ),
        ],
        components: badwordsMenu(ownerId),
      });
    }

    if (choice === 'clear_ignores') {
      client.db.updateGuild(interaction.guild.id, {
        automod_ignore_channels: '[]',
        automod_ignore_roles: '[]',
      });
      return refresh();
    }

    if (choice === 'reset') {
      resetAutomod(client.db, interaction.guild.id);
      await refresh();
      return interaction.followUp({
        embeds: [success('Automod settings reset to defaults.')],
        ephemeral: true,
      });
    }
  }

  if (action === 'asetup_punish' && interaction.isStringSelectMenu()) {
    const kind = parts[2];
    const value = interaction.values[0];
    const key =
      kind === 'antilink'
        ? 'automod_antilink_action'
        : kind === 'antispam'
          ? 'automod_antispam_action'
          : 'automod_badwords_action';
    client.db.updateGuild(interaction.guild.id, { [key]: value });
    return refresh();
  }

  if (action === 'asetup_ignore_channels' && interaction.isChannelSelectMenu()) {
    const ids = [...interaction.channels.keys()];
    client.db.updateGuild(interaction.guild.id, {
      automod_ignore_channels: JSON.stringify(ids),
    });
    return refresh();
  }

  if (action === 'asetup_ignore_roles' && interaction.isRoleSelectMenu()) {
    const ids = [...interaction.roles.keys()];
    client.db.updateGuild(interaction.guild.id, {
      automod_ignore_roles: JSON.stringify(ids),
    });
    return refresh();
  }

  if (action === 'asetup_badwords_menu' && interaction.isStringSelectMenu()) {
    const choice = interaction.values[0];
    const data = client.db.ensureGuild(interaction.guild.id);
    const words = parseJsonArray(data.badwords);

    if (choice === 'add') {
      return interaction.showModal(addWordModal());
    }
    if (choice === 'list') {
      await interaction.update({
        embeds: [
          automodPickerEmbed(
            'Bad words',
            'Add, remove, list, or clear banned words.'
          ),
        ],
        components: badwordsMenu(ownerId),
      });
      return interaction.followUp({
        embeds: [
          info(
            words.length ? words.map((w) => `\`${w}\``).join(', ') : 'Empty list.',
            'Bad words'
          ),
        ],
        ephemeral: true,
      });
    }
    if (choice === 'clear') {
      client.db.updateGuild(interaction.guild.id, { badwords: '[]' });
      return refresh();
    }
    if (choice === 'remove') {
      if (!words.length) {
        return interaction.reply({
          embeds: [error('Bad words list is empty.')],
          ephemeral: true,
        });
      }
      return interaction.update({
        embeds: [
          automodPickerEmbed(
            'Remove bad word',
            'Select a word to remove from the list.'
          ),
        ],
        components: removeWordPicker(ownerId, words),
      });
    }
  }

  if (action === 'asetup_badwords_remove' && interaction.isStringSelectMenu()) {
    const word = interaction.values[0];
    const data = client.db.ensureGuild(interaction.guild.id);
    const words = parseJsonArray(data.badwords).filter((w) => w !== word);
    client.db.updateGuild(interaction.guild.id, {
      badwords: JSON.stringify(words),
    });
    return refresh();
  }
}

async function handleConfigReset(client, interaction) {
  const [action, ownerId] = interaction.customId.split(':');
  if (interaction.user.id !== ownerId) {
    return interaction.reply({
      embeds: [error('Only the command author can use these buttons.')],
      ephemeral: true,
    });
  }
  if (!(await ensureConfigAdmin(client, interaction))) return;

  if (action === 'cfgreset_cancel') {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setDescription('Configuration reset cancelled.'),
      ],
      components: [],
    });
  }

  if (action === 'cfgreset_confirm') {
    client.db.updateGuild(interaction.guild.id, fullConfigReset());
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setTitle(withEmoji('config', 'Configuration reset'))
          .setDescription('All server settings were reset to defaults.')
          .setTimestamp(),
      ],
      components: [],
    });
  }
}

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    if (
      (interaction.isStringSelectMenu() || interaction.isButton()) &&
      interaction.customId.startsWith('help_')
    ) {
      return handleHelp(client, interaction);
    }

    if (
      (interaction.isStringSelectMenu() ||
        interaction.isChannelSelectMenu() ||
        interaction.isRoleSelectMenu() ||
        interaction.isButton()) &&
      interaction.customId.startsWith('tsetup_')
    ) {
      return handleTicketSetup(client, interaction);
    }

    if (
      (interaction.isStringSelectMenu() ||
        interaction.isChannelSelectMenu() ||
        interaction.isButton() ||
        interaction.isModalSubmit()) &&
      (interaction.customId.startsWith('wsetup_') ||
        interaction.customId === 'wsetup_message_modal')
    ) {
      return handleWelcomeSetup(client, interaction);
    }

    if (
      (interaction.isStringSelectMenu() ||
        interaction.isChannelSelectMenu() ||
        interaction.isButton() ||
        interaction.isModalSubmit()) &&
      (interaction.customId.startsWith('lsetup_') ||
        interaction.customId === 'lsetup_message_modal')
    ) {
      return handleLeaveSetup(client, interaction);
    }

    if (
      (interaction.isStringSelectMenu() ||
        interaction.isChannelSelectMenu() ||
        interaction.isRoleSelectMenu() ||
        interaction.isButton() ||
        interaction.isModalSubmit()) &&
      (interaction.customId.startsWith('asetup_') ||
        interaction.customId === 'asetup_badword_modal' ||
        interaction.customId === 'asetup_timeout_modal')
    ) {
      return handleAutomodSetup(client, interaction);
    }

    if (
      interaction.isButton() &&
      interaction.customId.startsWith('cfgreset_')
    ) {
      return handleConfigReset(client, interaction);
    }

    if (
      (interaction.isStringSelectMenu() ||
        interaction.isChannelSelectMenu() ||
        interaction.isRoleSelectMenu() ||
        interaction.isButton() ||
        interaction.isModalSubmit()) &&
      (interaction.customId.startsWith('gcreate_') ||
        [
          'gcreate_prize_modal',
          'gcreate_duration_modal',
          'gcreate_winners_modal',
          'gcreate_min_age_modal',
          'gcreate_bonus_entries_modal',
        ].includes(interaction.customId))
    ) {
      return handleGiveawayCreate(client, interaction);
    }

    if (interaction.isButton() && interaction.customId === 'giveaway_enter') {
      return handleGiveawayEnter(client, interaction);
    }

    if (interaction.isButton() && interaction.customId === 'giveaway_leave') {
      return handleGiveawayLeave(client, interaction);
    }

    if (
      interaction.isButton() &&
      (interaction.customId.startsWith('ttt_') ||
        interaction.customId === 'ttt_accept' ||
        interaction.customId === 'ttt_decline' ||
        interaction.customId === 'ttt_quit')
    ) {
      return handleTtt(client, interaction);
    }

    if (interaction.isButton() && interaction.customId.startsWith('c4_')) {
      return handleConnect4(client, interaction);
    }

    if (interaction.isButton() && interaction.customId.startsWith('poll_vote:')) {
      return handlePollVote(client, interaction);
    }

    if (interaction.isButton() && interaction.customId.startsWith('poll_end:')) {
      return handlePollEnd(client, interaction);
    }

    const ticketIds = [
      'ticket_open',
      'ticket_close',
      'ticket_close_confirm',
      'ticket_close_cancel',
      'ticket_close_reason',
      'ticket_close_modal',
      'ticket_transcript',
      'ticket_add',
      'ticket_remove',
      'ticket_add_select',
      'ticket_remove_select',
    ];

    if (
      (interaction.isButton() ||
        interaction.isUserSelectMenu() ||
        interaction.isModalSubmit()) &&
      ticketIds.includes(interaction.customId)
    ) {
      return handleTicketInteractions(client, interaction);
    }

    // Legacy panel button id support
    if (interaction.isButton() && interaction.customId === 'ticket_create') {
      await interaction.deferReply({ ephemeral: true });
      return openTicket(client, interaction);
    }
  },
};
