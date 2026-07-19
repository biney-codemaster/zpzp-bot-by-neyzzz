const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { error, success, color, info } = require('../utils/embeds');
const {
  buildHomeEmbed,
  buildCategoryEmbed,
  buildHelpComponents,
} = require('../utils/helpMenu');
const { hasLevel } = require('../utils/permissions');
const { applyComponentEmoji } = require('../utils/emoji');

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

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    if (
      (interaction.isStringSelectMenu() || interaction.isButton()) &&
      interaction.customId.startsWith('help_')
    ) {
      return handleHelp(client, interaction);
    }

    if (!interaction.isButton()) return;

    if (interaction.customId === 'giveaway_enter') {
      return handleGiveawayEnter(client, interaction);
    }

    if (interaction.customId === 'ticket_create') {
      await interaction.deferReply({ ephemeral: true });
      const g = client.db.ensureGuild(interaction.guild.id);
      if (!g.ticket_category) {
        return interaction.editReply({
          embeds: [error('Tickets are not set up. Use `+ticketsetup`.')],
        });
      }

      const existing = client.db.getOpenTicketByUser(
        interaction.guild.id,
        interaction.user.id
      );
      if (existing) {
        return interaction.editReply({
          embeds: [error(`You already have an open ticket: <#${existing.channel_id}>`)],
        });
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
          ],
        },
      ];

      if (g.ticket_support_role) {
        overwrites.push({
          id: g.ticket_support_role,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        });
      }

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '')
          .slice(0, 90),
        type: ChannelType.GuildText,
        parent: g.ticket_category,
        permissionOverwrites: overwrites,
        topic: `Ticket ${interaction.user.id}`,
      });

      client.db.createTicket(channel.id, interaction.guild.id, interaction.user.id);

      const closeBtn = new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close')
        .setStyle(ButtonStyle.Danger);
      applyComponentEmoji(closeBtn, 'close');

      await channel.send({
        content: g.ticket_support_role
          ? `${interaction.user} | <@&${g.ticket_support_role}>`
          : `${interaction.user}`,
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle('Ticket opened')
            .setDescription('Describe your request. Close with the button or `+close`.')
            .setTimestamp(),
        ],
        components: [new ActionRowBuilder().addComponents(closeBtn)],
      });

      return interaction.editReply({
        embeds: [success(`Ticket created: ${channel}`)],
      });
    }

    if (interaction.customId === 'ticket_close') {
      const ticket = client.db.getTicket(interaction.channel.id);
      if (!ticket || ticket.closed) {
        return interaction.reply({
          embeds: [error('This is not an open ticket.')],
          ephemeral: true,
        });
      }

      const g = client.db.ensureGuild(interaction.guild.id);
      const allowed =
        hasLevel(interaction.member, 'mod', g, client.config.ownerIds) ||
        (g.ticket_support_role &&
          interaction.member.roles.cache.has(g.ticket_support_role)) ||
        ticket.user_id === interaction.user.id;

      if (!allowed) {
        return interaction.reply({
          embeds: [error('You cannot close this ticket.')],
          ephemeral: true,
        });
      }

      await interaction.reply({
        embeds: [success('Closing in 5 seconds...')],
      });
      client.db.closeTicket(interaction.channel.id);

      if (g.ticket_log) {
        const log = interaction.guild.channels.cache.get(g.ticket_log);
        if (log) {
          await log
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor(color())
                  .setTitle('Ticket closed')
                  .addFields(
                    { name: 'Channel', value: interaction.channel.name, inline: true },
                    { name: 'Author', value: `<@${ticket.user_id}>`, inline: true },
                    { name: 'Closed by', value: `${interaction.user}`, inline: true }
                  )
                  .setTimestamp(),
              ],
            })
            .catch(() => null);
        }
      }

      setTimeout(() => {
        interaction.channel.delete('Ticket closed').catch(() => null);
      }, 5000);
    }
  },
};
