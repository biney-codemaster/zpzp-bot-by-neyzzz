const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { error, success, color } = require('../utils/embeds');
const {
  buildHomeEmbed,
  buildCategoryEmbed,
  buildHelpComponents,
} = require('../utils/helpMenu');
const { hasLevel } = require('../utils/permissions');

async function handleHelp(client, interaction) {
  const [action, ownerId] = interaction.customId.split(':');
  if (!['help_select', 'help_home', 'help_close'].includes(action)) return false;

  if (interaction.user.id !== ownerId) {
    await interaction.reply({
      embeds: [error("Seul l'auteur peut utiliser ce menu.")],
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
          .setDescription('Menu fermé. Relance `+help` pour le rouvrir.'),
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

    if (interaction.customId === 'ticket_create') {
      await interaction.deferReply({ ephemeral: true });
      const g = client.db.ensureGuild(interaction.guild.id);
      if (!g.ticket_category) {
        return interaction.editReply({
          embeds: [error('Tickets non configurés. Utilise `+ticketsetup`.')],
        });
      }

      const existing = client.db.getOpenTicketByUser(
        interaction.guild.id,
        interaction.user.id
      );
      if (existing) {
        return interaction.editReply({
          embeds: [error(`Ticket déjà ouvert : <#${existing.channel_id}>`)],
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

      await channel.send({
        content: g.ticket_support_role
          ? `${interaction.user} | <@&${g.ticket_support_role}>`
          : `${interaction.user}`,
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle('Ticket ouvert')
            .setDescription(
              `Explique ta demande. Ferme avec le bouton ou \`+close\`.`
            )
            .setTimestamp(),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('ticket_close')
              .setLabel('Fermer')
              .setStyle(ButtonStyle.Danger)
          ),
        ],
      });

      return interaction.editReply({
        embeds: [success(`Ticket créé : ${channel}`)],
      });
    }

    if (interaction.customId === 'ticket_close') {
      const ticket = client.db.getTicket(interaction.channel.id);
      if (!ticket || ticket.closed) {
        return interaction.reply({
          embeds: [error("Ce n'est pas un ticket ouvert.")],
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
          embeds: [error('Tu ne peux pas fermer ce ticket.')],
          ephemeral: true,
        });
      }

      await interaction.reply({
        embeds: [success('Fermeture dans 5 secondes…')],
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
                  .setTitle('Ticket fermé')
                  .addFields(
                    { name: 'Salon', value: interaction.channel.name, inline: true },
                    { name: 'Auteur', value: `<@${ticket.user_id}>`, inline: true },
                    { name: 'Par', value: `${interaction.user}`, inline: true }
                  )
                  .setTimestamp(),
              ],
            })
            .catch(() => null);
        }
      }

      setTimeout(() => {
        interaction.channel.delete('Ticket fermé').catch(() => null);
      }, 5000);
    }
  },
};
