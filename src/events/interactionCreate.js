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

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    if (
      (interaction.isStringSelectMenu() || interaction.isButton()) &&
      interaction.customId.startsWith('help_')
    ) {
      return handleHelp(client, interaction);
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
