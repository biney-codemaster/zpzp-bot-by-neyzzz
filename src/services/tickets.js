const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
} = require('discord.js');
const config = require('../../config');
const { color, error, success } = require('../utils/embeds');
const { applyComponentEmoji, withEmoji } = require('../utils/emoji');
const { hasLevel } = require('../utils/permissions');
const { buildTranscript } = require('../utils/transcript');
const { formatDuration } = require('../utils/helpers');

const openCooldowns = new Map();

const DEFAULT_PANEL_TITLE = 'Support';
const DEFAULT_PANEL_DESCRIPTION = [
  'Need help? Open a private support ticket.',
  '',
  'One open ticket per user.',
  'Staff will respond as soon as possible.',
].join('\n');

function isTicketStaff(member, guildData, ownerIds = []) {
  if (!member) return false;
  if (hasLevel(member, 'mod', guildData, ownerIds)) return true;
  if (guildData.ticket_support_role && member.roles.cache.has(guildData.ticket_support_role)) {
    return true;
  }
  return false;
}

function sanitizeChannelName(username) {
  const base = `ticket-${username}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return (base || 'ticket-user').slice(0, 90);
}

function normalizeTicketName(input) {
  const cleaned = String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
  return cleaned || null;
}

function panelComponents() {
  const open = new ButtonBuilder()
    .setCustomId('ticket_open')
    .setLabel('Open ticket')
    .setStyle(ButtonStyle.Primary);
  applyComponentEmoji(open, 'ticketOpen');
  return [new ActionRowBuilder().addComponents(open)];
}

function ticketControls() {
  const close = new ButtonBuilder()
    .setCustomId('ticket_close')
    .setLabel('Close')
    .setStyle(ButtonStyle.Danger);
  applyComponentEmoji(close, 'ticketClose');

  const add = new ButtonBuilder()
    .setCustomId('ticket_add')
    .setLabel('Add')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(add, 'ticketAdd');

  const remove = new ButtonBuilder()
    .setCustomId('ticket_remove')
    .setLabel('Remove')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(remove, 'ticketRemove');

  const rename = new ButtonBuilder()
    .setCustomId('ticket_rename')
    .setLabel('Rename')
    .setStyle(ButtonStyle.Secondary);

  return [new ActionRowBuilder().addComponents(close, add, remove, rename)];
}

function closeConfirmComponents() {
  const confirm = new ButtonBuilder()
    .setCustomId('ticket_close_confirm')
    .setLabel('Confirm close')
    .setStyle(ButtonStyle.Danger);
  applyComponentEmoji(confirm, 'ticketConfirm');

  const reason = new ButtonBuilder()
    .setCustomId('ticket_close_reason')
    .setLabel('Close with reason')
    .setStyle(ButtonStyle.Secondary);

  const cancel = new ButtonBuilder()
    .setCustomId('ticket_close_cancel')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);
  applyComponentEmoji(cancel, 'ticketCancel');

  return [new ActionRowBuilder().addComponents(confirm, reason, cancel)];
}

function renameModal(currentName = '') {
  return new ModalBuilder()
    .setCustomId('ticket_rename_modal')
    .setTitle('Rename ticket')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('ticket_name')
          .setLabel('Channel name')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(90)
          .setValue(String(currentName || '').slice(0, 90))
      )
    );
}

async function sendTicketLog(client, guild, { title, fields, files = [] }) {
  const g = client.db.ensureGuild(guild.id);
  if (!g.ticket_log) return;
  const channel = guild.channels.cache.get(g.ticket_log);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(color())
    .setTitle(withEmoji('tickets', title))
    .addFields(...fields)
    .setTimestamp();

  await channel.send({ embeds: [embed], files }).catch(() => null);
}

async function openTicket(client, interaction) {
  const g = client.db.ensureGuild(interaction.guild.id);
  if (!g.ticket_category) {
    return interaction.editReply({
      embeds: [error('Tickets are not set up. An admin must run `+ticketsetup`.')],
    });
  }

  const existing = client.db.getOpenTicketByUser(interaction.guild.id, interaction.user.id);
  if (existing) {
    return interaction.editReply({
      embeds: [error(`You already have an open ticket: <#${existing.channel_id}>`)],
    });
  }

  const cooldownKey = `${interaction.guild.id}:${interaction.user.id}`;
  const last = openCooldowns.get(cooldownKey) || 0;
  const left = last + config.tickets.openCooldownMs - Date.now();
  if (left > 0) {
    return interaction.editReply({
      embeds: [error(`Please wait ${formatDuration(left)} before opening another ticket.`)],
    });
  }

  const lastClosed = client.db.getLastClosedTicket(interaction.guild.id, interaction.user.id);
  if (lastClosed?.closed_at) {
    const sinceClose = lastClosed.closed_at + config.tickets.openCooldownMs - Date.now();
    if (sinceClose > 0) {
      return interaction.editReply({
        embeds: [error(`Please wait ${formatDuration(sinceClose)} before opening another ticket.`)],
      });
    }
  }

  const overwrites = [
    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
    {
      id: client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  if (g.ticket_support_role) {
    overwrites.push({
      id: g.ticket_support_role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  const channel = await interaction.guild.channels.create({
    name: sanitizeChannelName(interaction.user.username),
    type: ChannelType.GuildText,
    parent: g.ticket_category,
    permissionOverwrites: overwrites,
    topic: `Support ticket · ${interaction.user.id}`,
  });

  client.db.createTicket(channel.id, interaction.guild.id, interaction.user.id);
  openCooldowns.set(cooldownKey, Date.now());

  await channel.send({
    content: g.ticket_support_role
      ? `${interaction.user} | <@&${g.ticket_support_role}>`
      : `${interaction.user}`,
    embeds: [
      new EmbedBuilder()
        .setColor(color())
        .setTitle(withEmoji('tickets', 'Support ticket'))
        .setDescription(
          [
            `Hey ${interaction.user} — describe your issue.`,
            'Staff will help you here.',
            '',
            'Controls below are **staff only**.',
          ].join('\n')
        )
        .addFields(
          { name: 'Author', value: `${interaction.user}`, inline: true },
          { name: 'Type', value: 'Support', inline: true }
        )
        .setTimestamp(),
    ],
    components: ticketControls(),
  });

  await sendTicketLog(client, interaction.guild, {
    title: 'Ticket opened',
    fields: [
      { name: 'Channel', value: `${channel}`, inline: true },
      { name: 'Author', value: `${interaction.user}`, inline: true },
      { name: 'Type', value: 'Support', inline: true },
    ],
  });

  return interaction.editReply({
    embeds: [success(`Ticket created: ${channel}`)],
  });
}

/**
 * Core close logic shared by button flow and +tclose.
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
async function performClose(client, { guild, channel, closer, reason = null }) {
  const ticket = client.db.getTicket(channel.id);
  if (!ticket || ticket.closed) {
    return { ok: false, message: 'This is not an open ticket.' };
  }

  const g = client.db.ensureGuild(guild.id);
  let transcript;
  try {
    transcript = await buildTranscript(channel, {
      ticket,
      closedBy: closer,
      reason,
    });
  } catch (err) {
    console.error('[transcript]', err);
  }

  client.db.closeTicket(channel.id, {
    closedBy: closer.id,
    reason,
  });

  const files = transcript ? [transcript] : [];

  await sendTicketLog(client, guild, {
    title: 'Ticket closed',
    fields: [
      { name: 'Channel', value: `#${channel.name}`, inline: true },
      { name: 'Author', value: `<@${ticket.user_id}>`, inline: true },
      { name: 'Closed by', value: `${closer}`, inline: true },
      { name: 'Reason', value: reason || 'None' },
    ],
    files,
  });

  const author = await client.users.fetch(ticket.user_id).catch(() => null);
  if (author && transcript) {
    await author
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle(withEmoji('tickets', 'Ticket closed'))
            .setDescription(
              `Your support ticket in **${guild.name}** was closed.\nReason: ${reason || 'None'}`
            )
            .setTimestamp(),
        ],
        files: [transcript],
      })
      .catch(() => null);
  }

  setTimeout(async () => {
    await sendTicketLog(client, guild, {
      title: 'Ticket deleted',
      fields: [
        { name: 'Channel', value: `#${channel.name}`, inline: true },
        { name: 'Author', value: `<@${ticket.user_id}>`, inline: true },
        { name: 'Closed by', value: `${closer}`, inline: true },
      ],
    });
    await channel.delete('Ticket closed').catch(() => null);
  }, config.tickets.deleteDelayMs);

  return { ok: true, ticket };
}

async function finalizeClose(client, interaction, reason = null) {
  const ticket = client.db.getTicket(interaction.channel.id);
  if (!ticket || ticket.closed) {
    const payload = { embeds: [error('This is not an open ticket.')], ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      return interaction.followUp(payload);
    }
    return interaction.reply(payload);
  }

  const g = client.db.ensureGuild(interaction.guild.id);
  if (!isTicketStaff(interaction.member, g, client.config.ownerIds)) {
    const payload = { embeds: [error('Only staff can close tickets.')], ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      return interaction.followUp(payload);
    }
    return interaction.reply(payload);
  }

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply();
  }

  const result = await performClose(client, {
    guild: interaction.guild,
    channel: interaction.channel,
    closer: interaction.user,
    reason,
  });

  if (!result.ok) {
    return interaction.editReply({ embeds: [error(result.message)] });
  }

  return interaction.editReply({
    embeds: [
      success(
        `Ticket closed. Channel deletes in ${Math.floor(config.tickets.deleteDelayMs / 1000)}s.`
      ),
    ],
    components: [],
  });
}

async function addUserToTicket(client, channel, actor, user) {
  const ticket = client.db.getTicket(channel.id);
  if (!ticket || ticket.closed) {
    return { ok: false, message: 'This is not an open ticket.' };
  }
  if (!user || user.bot) {
    return { ok: false, message: 'Invalid user.' };
  }

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: true,
    SendMessages: true,
    AttachFiles: true,
    ReadMessageHistory: true,
  });

  await channel
    .send({ embeds: [success(`${user} was added to the ticket by ${actor}.`)] })
    .catch(() => null);

  return { ok: true };
}

async function removeUserFromTicket(client, channel, actor, user) {
  const ticket = client.db.getTicket(channel.id);
  if (!ticket || ticket.closed) {
    return { ok: false, message: 'This is not an open ticket.' };
  }
  if (!user) {
    return { ok: false, message: 'Invalid user.' };
  }
  if (user.id === ticket.user_id) {
    return { ok: false, message: 'You cannot remove the ticket author.' };
  }
  if (user.id === client.user.id) {
    return { ok: false, message: 'You cannot remove the bot.' };
  }

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: false,
  });

  await channel
    .send({ embeds: [success(`${user} was removed from the ticket by ${actor}.`)] })
    .catch(() => null);

  return { ok: true };
}

async function renameTicket(client, channel, actor, rawName) {
  const ticket = client.db.getTicket(channel.id);
  if (!ticket || ticket.closed) {
    return { ok: false, message: 'This is not an open ticket.' };
  }

  const name = normalizeTicketName(rawName);
  if (!name) {
    return {
      ok: false,
      message: 'Invalid name. Use letters, numbers, `-` or `_` (max 90).',
    };
  }

  try {
    await channel.setName(name, `Renamed by ${actor.tag}`);
  } catch (err) {
    console.error('[ticket:rename]', err);
    return { ok: false, message: 'Failed to rename this channel. Check my permissions.' };
  }

  await channel
    .send({ embeds: [success(`Ticket renamed to \`${name}\` by ${actor}.`)] })
    .catch(() => null);

  return { ok: true, name };
}

function userSelectRow(customId, placeholder) {
  return new ActionRowBuilder().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .setMinValues(1)
      .setMaxValues(1)
  );
}

function getPanelTitle(guildData) {
  return guildData.ticket_panel_title || DEFAULT_PANEL_TITLE;
}

function getPanelDescription(guildData) {
  return guildData.ticket_panel_description || DEFAULT_PANEL_DESCRIPTION;
}

module.exports = {
  isTicketStaff,
  panelComponents,
  ticketControls,
  closeConfirmComponents,
  renameModal,
  openTicket,
  finalizeClose,
  performClose,
  addUserToTicket,
  removeUserFromTicket,
  renameTicket,
  sendTicketLog,
  userSelectRow,
  sanitizeChannelName,
  normalizeTicketName,
  DEFAULT_PANEL_TITLE,
  DEFAULT_PANEL_DESCRIPTION,
  getPanelTitle,
  getPanelDescription,
};
