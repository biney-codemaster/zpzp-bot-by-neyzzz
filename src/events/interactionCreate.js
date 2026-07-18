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

async function handleHelpInteraction(client, interaction) {
  const [action, ownerId] = interaction.customId.split(':');
  if (!['help_select', 'help_home', 'help_close'].includes(action)) return false;

  if (interaction.user.id !== ownerId) {
    await interaction.reply({
      embeds: [error("Seul l'auteur de la commande peut utiliser ce menu.")],
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
          .setAuthor({
            name: `${client.user.username} • Centre d'aide`,
            iconURL: client.user.displayAvatarURL({ size: 128 }),
          })
          .setDescription('Menu fermé. Relance `+help` quand tu veux.'),
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

  if (action === 'help_select') {
    const categoryId = interaction.values[0];
    await interaction.update({
      embeds: [
        buildCategoryEmbed(client, interaction.user, prefix, categoryId),
      ],
      components: buildHelpComponents(client, interaction.user.id, categoryId),
    });
    return true;
  }

  return false;
}

async function handleTicketCreate(client, interaction) {
  await interaction.deferReply({ ephemeral: true });
  const guildData = client.db.ensureGuild(interaction.guild.id);

  if (!guildData.ticket_category) {
    return interaction.editReply({
      embeds: [
        error(
          "Le système de tickets n'est pas configuré. Utilise `+ticketsetup`."
        ),
      ],
    });
  }

  const existing = client.db.getOpenTicketByUser(
    interaction.guild.id,
    interaction.user.id
  );
  if (existing) {
    return interaction.editReply({
      embeds: [
        error(`Tu as déjà un ticket ouvert : <#${existing.channel_id}>`),
      ],
    });
  }

  const overwrites = [
    {
      id: interaction.guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
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
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
      ],
    },
  ];

  if (guildData.ticket_support_role) {
    overwrites.push({
      id: guildData.ticket_support_role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`
      .slice(0, 90)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, ''),
    type: ChannelType.GuildText,
    parent: guildData.ticket_category,
    permissionOverwrites: overwrites,
    topic: `Ticket de ${interaction.user.tag} (${interaction.user.id})`,
  });

  client.db.createTicket(channel.id, interaction.guild.id, interaction.user.id);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Fermer le ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒')
  );

  const embed = new EmbedBuilder()
    .setColor(color())
    .setTitle('🎫 Ticket ouvert')
    .setDescription(
      `Salut ${interaction.user} ! Décris ton problème, le staff va te répondre.\nUtilise le bouton ou \`+close\` pour fermer.`
    )
    .setTimestamp();

  await channel.send({
    content: guildData.ticket_support_role
      ? `${interaction.user} | <@&${guildData.ticket_support_role}>`
      : `${interaction.user}`,
    embeds: [embed],
    components: [row],
  });

  return interaction.editReply({
    embeds: [success(`Ton ticket a été créé : ${channel}`)],
  });
}

async function handleTicketClose(client, interaction) {
  const ticket = client.db.getTicket(interaction.channel.id);
  if (!ticket || ticket.closed) {
    return interaction.reply({
      embeds: [error("Ce salon n'est pas un ticket ouvert.")],
      ephemeral: true,
    });
  }

  const guildData = client.db.ensureGuild(interaction.guild.id);
  const isStaff =
    interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) ||
    (guildData.ticket_support_role &&
      interaction.member.roles.cache.has(guildData.ticket_support_role)) ||
    ticket.user_id === interaction.user.id;

  if (!isStaff) {
    return interaction.reply({
      embeds: [error('Tu ne peux pas fermer ce ticket.')],
      ephemeral: true,
    });
  }

  await interaction.reply({
    embeds: [success('Ticket fermé. Suppression dans 5 secondes...')],
  });
  client.db.closeTicket(interaction.channel.id);

  if (guildData.ticket_log) {
    const log = interaction.guild.channels.cache.get(guildData.ticket_log);
    if (log) {
      await log
        .send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xed4245)
              .setTitle('🎫 Ticket fermé')
              .addFields(
                {
                  name: 'Salon',
                  value: interaction.channel.name,
                  inline: true,
                },
                {
                  name: 'Auteur',
                  value: `<@${ticket.user_id}>`,
                  inline: true,
                },
                {
                  name: 'Fermé par',
                  value: `${interaction.user}`,
                  inline: true,
                }
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

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    if (interaction.isStringSelectMenu() || interaction.isButton()) {
      if (interaction.customId.startsWith('help_')) {
        return handleHelpInteraction(client, interaction);
      }
    }

    if (!interaction.isButton()) return;

    if (interaction.customId === 'ticket_create') {
      return handleTicketCreate(client, interaction);
    }

    if (interaction.customId === 'ticket_close') {
      return handleTicketClose(client, interaction);
    }
  },
};
