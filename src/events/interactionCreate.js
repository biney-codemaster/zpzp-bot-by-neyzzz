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
  mainMenu: ticketMainMenu,
  categoryPicker,
  supportPicker,
  logsPicker,
  panelPicker,
  pickerEmbed: ticketPickerEmbed,
  postPanel,
  assertOwner: assertTicketOwner,
} = require('../services/ticketSetup');
const { hasLevel } = require('../utils/permissions');
const {
  buildModEmbed,
  mainMenu: modMainMenu,
  modlogPicker,
  userPicker,
  thresholdsModal,
  caseLookupModal,
  pickerEmbed: modPickerEmbed,
  assertOwner: assertModOwner,
  canUseModMenu,
  buildWarningsEmbed,
  buildHistoryEmbed,
  buildRecentEmbed,
  buildCaseLookupEmbed,
} = require('../services/modMenu');
const { parseDuration } = require('../utils/helpers');

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
  if (!giveaway || giveaway.ended) {
    return interaction.reply({
      embeds: [error('This giveaway is no longer active.')],
      ephemeral: true,
    });
  }

  const entries = new Set(giveaway.entries || []);
  if (entries.has(interaction.user.id)) {
    return interaction.reply({
      embeds: [info('You are already entered.')],
      ephemeral: true,
    });
  }

  entries.add(interaction.user.id);
  client.db.updateGiveaway(interaction.message.id, { entries: [...entries] });

  return interaction.reply({
    embeds: [success(`You entered the giveaway. Entries: **${entries.size}**`)],
    ephemeral: true,
  });
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
  if (!assertTicketOwner(interaction, ownerId)) {
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
      components: ticketMainMenu(ownerId),
    });
  }

  if (action === 'tsetup_menu' && interaction.isStringSelectMenu()) {
    const choice = interaction.values[0];

    if (choice === 'category') {
      return interaction.update({
        embeds: [
          ticketPickerEmbed(
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
          ticketPickerEmbed(
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
          ticketPickerEmbed(
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
        components: ticketMainMenu(ownerId),
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
          ticketPickerEmbed(
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
      components: ticketMainMenu(ownerId),
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
      components: ticketMainMenu(ownerId),
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
      components: ticketMainMenu(ownerId),
    });
  }

  if (action === 'tsetup_panel' && interaction.isChannelSelectMenu()) {
    const channel = interaction.channels.first();
    const data = client.db.ensureGuild(interaction.guild.id);

    if (!data.ticket_category || !data.ticket_support_role) {
      return interaction.update({
        embeds: [buildSetupEmbed(interaction.guild, data)],
        components: ticketMainMenu(ownerId),
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
        components: ticketMainMenu(ownerId),
      }).then(() =>
        interaction.followUp({
          embeds: [error('Failed to post the panel. Check my permissions in that channel.')],
          ephemeral: true,
        })
      );
    }

    await interaction.update({
      embeds: [buildSetupEmbed(interaction.guild, data)],
      components: ticketMainMenu(ownerId),
    });

    return interaction.followUp({
      embeds: [success(`Panel posted in ${channel}.`)],
      ephemeral: true,
    });
  }
}

async function handleModMenu(client, interaction) {
  const guildData = client.db.ensureGuild(interaction.guild.id);
  if (!canUseModMenu(interaction.member, guildData, client.config.ownerIds)) {
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        embeds: [error('You do not have access to the moderation panel.')],
        ephemeral: true,
      });
    }
    return;
  }

  const isAdmin = hasLevel(
    interaction.member,
    'admin',
    guildData,
    client.config.ownerIds
  );
  const thresholds = client.db.getWarnThresholds(interaction.guild.id);

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'mod_case_modal') {
      const caseId = Number(interaction.fields.getTextInputValue('case_id'));
      if (!caseId) {
        return interaction.reply({
          embeds: [error('Invalid case ID.')],
          ephemeral: true,
        });
      }
      const row = client.db.getModCase(interaction.guild.id, caseId);
      return interaction.reply({
        embeds: [buildCaseLookupEmbed(interaction.guild, row)],
        ephemeral: true,
      });
    }

    if (interaction.customId === 'mod_thresholds_modal') {
      if (!isAdmin) {
        return interaction.reply({
          embeds: [error('Admin permission required.')],
          ephemeral: true,
        });
      }

      const mute = Number(interaction.fields.getTextInputValue('mute'));
      const kick = Number(interaction.fields.getTextInputValue('kick'));
      const ban = Number(interaction.fields.getTextInputValue('ban'));
      const duration = interaction.fields.getTextInputValue('duration').trim();

      if ([mute, kick, ban].some((n) => Number.isNaN(n) || n < 0)) {
        return interaction.reply({
          embeds: [error('Thresholds must be numbers >= 0.')],
          ephemeral: true,
        });
      }
      if (!parseDuration(duration)) {
        return interaction.reply({
          embeds: [error('Invalid auto-mute duration (e.g. `1h`, `30m`).')],
          ephemeral: true,
        });
      }

      client.db.updateGuild(interaction.guild.id, {
        warn_auto_mute: mute,
        warn_auto_kick: kick,
        warn_auto_ban: ban,
        warn_auto_mute_duration: duration,
      });

      const data = client.db.ensureGuild(interaction.guild.id);
      const updated = client.db.getWarnThresholds(interaction.guild.id);

      await interaction.reply({
        embeds: [success('Auto-warn thresholds updated.')],
        ephemeral: true,
      });

      if (interaction.message?.editable) {
        await interaction.message.edit({
          embeds: [buildModEmbed(interaction.guild, data, updated)],
          components: modMainMenu(interaction.user.id, isAdmin),
        });
      }
      return;
    }
    return;
  }

  const parts = interaction.customId.split(':');
  const action = parts[0];
  const ownerId =
    action === 'mod_user' ? parts[2] : parts[1];

  if (!assertModOwner(interaction, ownerId)) {
    return interaction.reply({
      embeds: [error('Only the command author can use this menu.')],
      ephemeral: true,
    });
  }

  if (action === 'mod_close') {
    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(color())
          .setDescription('Menu closed. Run `+mod` to open it again.'),
      ],
      components: [],
    });
  }

  if (action === 'mod_back') {
    const data = client.db.ensureGuild(interaction.guild.id);
    const t = client.db.getWarnThresholds(interaction.guild.id);
    return interaction.update({
      embeds: [buildModEmbed(interaction.guild, data, t)],
      components: modMainMenu(ownerId, isAdmin),
    });
  }

  if (action === 'mod_menu' && interaction.isStringSelectMenu()) {
    const choice = interaction.values[0];

    if (choice === 'case') {
      return interaction.showModal(caseLookupModal());
    }

    if (choice === 'warnings') {
      return interaction.update({
        embeds: [
          modPickerEmbed('Member warnings', 'Select a member to view their warnings.'),
        ],
        components: userPicker(ownerId, 'warnings'),
      });
    }

    if (choice === 'history') {
      return interaction.update({
        embeds: [
          modPickerEmbed('Member history', 'Select a member to view their moderation history.'),
        ],
        components: userPicker(ownerId, 'history'),
      });
    }

    if (choice === 'recent') {
      const cases = client.db.getRecentModCases(interaction.guild.id, 10);
      return interaction.update({
        embeds: [buildRecentEmbed(interaction.guild, cases)],
        components: [modMainMenu(ownerId, isAdmin)[1]],
      });
    }

    if (choice === 'modlog') {
      if (!isAdmin) {
        return interaction.reply({
          embeds: [error('Admin permission required.')],
          ephemeral: true,
        });
      }
      return interaction.update({
        embeds: [
          modPickerEmbed('Modlog channel', 'Select where moderation actions are logged.'),
        ],
        components: modlogPicker(ownerId),
      });
    }

    if (choice === 'thresholds') {
      if (!isAdmin) {
        return interaction.reply({
          embeds: [error('Admin permission required.')],
          ephemeral: true,
        });
      }
      const t = client.db.getWarnThresholds(interaction.guild.id);
      const modal = thresholdsModal();
      modal.components[0].components[0].setValue(String(t.mute));
      modal.components[1].components[0].setValue(String(t.kick));
      modal.components[2].components[0].setValue(String(t.ban));
      modal.components[3].components[0].setValue(t.muteDuration);
      return interaction.showModal(modal);
    }
  }

  if (action === 'mod_modlog' && interaction.isChannelSelectMenu()) {
    if (!isAdmin) {
      return interaction.reply({
        embeds: [error('Admin permission required.')],
        ephemeral: true,
      });
    }
    const channel = interaction.channels.first();
    client.db.updateGuild(interaction.guild.id, { modlog_channel: channel.id });
    const data = client.db.ensureGuild(interaction.guild.id);
    const t = client.db.getWarnThresholds(interaction.guild.id);
    await interaction.update({
      embeds: [buildModEmbed(interaction.guild, data, t)],
      components: modMainMenu(ownerId, isAdmin),
    });
    return interaction.followUp({
      embeds: [success(`Modlog channel set to ${channel}.`)],
      ephemeral: true,
    });
  }

  if (action === 'mod_user' && interaction.isUserSelectMenu()) {
    const subAction = parts[1];
    const user = interaction.users.first();

    if (subAction === 'warnings') {
      const warns = client.db.getWarnings(interaction.guild.id, user.id);
      return interaction.update({
        embeds: [buildWarningsEmbed(user, warns)],
        components: [modMainMenu(ownerId, isAdmin)[1]],
      });
    }

    if (subAction === 'history') {
      const cases = client.db.getModCases(interaction.guild.id, user.id, 12);
      return interaction.update({
        embeds: [buildHistoryEmbed(user, cases)],
        components: [modMainMenu(ownerId, isAdmin)[1]],
      });
    }
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
        interaction.isUserSelectMenu() ||
        interaction.isButton() ||
        interaction.isModalSubmit()) &&
      (interaction.customId.startsWith('mod_') ||
        interaction.customId === 'mod_case_modal' ||
        interaction.customId === 'mod_thresholds_modal')
    ) {
      return handleModMenu(client, interaction);
    }

    if (interaction.isButton() && interaction.customId === 'giveaway_enter') {
      return handleGiveawayEnter(client, interaction);
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
