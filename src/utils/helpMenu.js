const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { color } = require('./embeds');

const CATEGORIES = [
  {
    id: 'moderation',
    label: 'Modération',
    emoji: '🛡️',
    description: 'Sanctionner et gérer le serveur',
  },
  {
    id: 'utility',
    label: 'Utilitaires',
    emoji: '🛠️',
    description: 'Infos, outils et aides du quotidien',
  },
  {
    id: 'fun',
    label: 'Fun',
    emoji: '🎉',
    description: 'Jeux, blagues et commandes fun',
  },
  {
    id: 'economy',
    label: 'Économie',
    emoji: '💰',
    description: 'Argent, boutique et classements',
  },
  {
    id: 'levels',
    label: 'Niveaux',
    emoji: '📈',
    description: 'XP, ranks et progression',
  },
  {
    id: 'tickets',
    label: 'Tickets',
    emoji: '🎫',
    description: 'Support et tickets privés',
  },
  {
    id: 'suggestions',
    label: 'Suggestions',
    emoji: '💡',
    description: 'Proposer et gérer des idées',
  },
  {
    id: 'giveaways',
    label: 'Giveaways',
    emoji: '🎁',
    description: 'Lancer et gérer des concours',
  },
  {
    id: 'config',
    label: 'Configuration',
    emoji: '⚙️',
    description: 'Réglages du bot sur le serveur',
  },
  {
    id: 'admin',
    label: 'Admin',
    emoji: '👑',
    description: 'Commandes propriétaire du bot',
    ownerOnly: true,
  },
];

function getVisibleCategories(client, userId) {
  return CATEGORIES.filter((cat) => {
    if (cat.ownerOnly && !client.config.ownerIds.includes(userId)) return false;
    return getCategoryCommands(client, cat.id, userId).length > 0;
  });
}

function getCategoryCommands(client, categoryId, userId) {
  return [...client.commands.values()]
    .filter((cmd) => {
      if (cmd.category !== categoryId) return false;
      if (cmd.ownerOnly && !client.config.ownerIds.includes(userId)) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function categoryLabel(categoryId) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat ? `${cat.emoji} ${cat.label}` : categoryId;
}

function buildHomeEmbed(client, user, prefix) {
  const categories = getVisibleCategories(client, user.id);
  const total = [...client.commands.values()].filter((cmd) => {
    if (cmd.ownerOnly && !client.config.ownerIds.includes(user.id)) return false;
    return true;
  }).length;

  const categoryLines = categories
    .map((cat) => {
      const count = getCategoryCommands(client, cat.id, user.id).length;
      return `${cat.emoji} **${cat.label}** — ${cat.description} · \`${count}\``;
    })
    .join('\n');

  return new EmbedBuilder()
    .setColor(color())
    .setAuthor({
      name: `${client.user.username} • Centre d'aide`,
      iconURL: client.user.displayAvatarURL({ size: 128 }),
    })
    .setTitle('Bienvenue')
    .setDescription(
      [
        `Salut ${user}, voici le menu d'aide du bot.`,
        '',
        `**Préfixe :** \`${prefix}\``,
        `**Commandes :** \`${total}\``,
        '',
        'Utilise le **menu** ci-dessous pour ouvrir une catégorie.',
        `Tu peux aussi faire \`${prefix}help <commande>\` pour le détail.`,
      ].join('\n')
    )
    .addFields({
      name: 'Catégories',
      value: categoryLines || 'Aucune catégorie disponible.',
    })
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setFooter({
      text: `Demandé par ${user.username}`,
      iconURL: user.displayAvatarURL({ size: 64 }),
    })
    .setTimestamp();
}

function buildCategoryEmbed(client, user, prefix, categoryId) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  const commands = getCategoryCommands(client, categoryId, user.id);

  const embed = new EmbedBuilder()
    .setColor(color())
    .setAuthor({
      name: `${client.user.username} • Centre d'aide`,
      iconURL: client.user.displayAvatarURL({ size: 128 }),
    })
    .setTitle(cat ? `${cat.emoji} ${cat.label}` : 'Catégorie')
    .setDescription(cat?.description || 'Commandes de cette catégorie')
    .setFooter({
      text: `${commands.length} commande${commands.length > 1 ? 's' : ''} • ${user.username}`,
      iconURL: user.displayAvatarURL({ size: 64 }),
    })
    .setTimestamp();

  if (!commands.length) {
    return embed.addFields({ name: 'Commandes', value: '_Aucune commande._' });
  }

  // Découpe en fields Discord (max 1024) pour rester propre
  let chunk = '';
  let index = 1;

  for (const cmd of commands) {
    const usage = cmd.usage ? ` ${cmd.usage}` : '';
    const line = `▸ \`${prefix}${cmd.name}${usage}\`\n└ ${cmd.description || 'Pas de description'}\n\n`;

    if ((chunk + line).length > 1000) {
      embed.addFields({
        name: index === 1 ? 'Commandes' : 'Suite',
        value: chunk.trimEnd(),
      });
      chunk = line;
      index += 1;
    } else {
      chunk += line;
    }
  }

  if (chunk) {
    embed.addFields({
      name: index === 1 ? 'Commandes' : 'Suite',
      value: chunk.trimEnd(),
    });
  }

  return embed;
}

function buildCommandEmbed(client, command, prefix) {
  return new EmbedBuilder()
    .setColor(color())
    .setAuthor({
      name: `${client.user.username} • Fiche commande`,
      iconURL: client.user.displayAvatarURL({ size: 128 }),
    })
    .setTitle(`${prefix}${command.name}`)
    .setDescription(command.description || 'Pas de description')
    .addFields(
      {
        name: 'Usage',
        value: `\`${prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}\``,
      },
      {
        name: 'Alias',
        value: command.aliases?.length
          ? command.aliases.map((a) => `\`${a}\``).join(', ')
          : 'Aucun',
        inline: true,
      },
      {
        name: 'Catégorie',
        value: categoryLabel(command.category),
        inline: true,
      },
      {
        name: 'Cooldown',
        value: `${command.cooldown || 3}s`,
        inline: true,
      }
    )
    .setTimestamp();
}

function buildHelpComponents(client, userId, selected = null) {
  const categories = getVisibleCategories(client, userId);

  const select = new StringSelectMenuBuilder()
    .setCustomId(`help_select:${userId}`)
    .setPlaceholder('Choisis une catégorie…')
    .addOptions(
      categories.map((cat) => ({
        label: cat.label,
        value: cat.id,
        description: cat.description.slice(0, 100),
        emoji: cat.emoji,
        default: selected === cat.id,
      }))
    );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`help_home:${userId}`)
      .setLabel('Accueil')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!selected),
    new ButtonBuilder()
      .setCustomId(`help_close:${userId}`)
      .setLabel('Fermer')
      .setEmoji('✖️')
      .setStyle(ButtonStyle.Danger)
  );

  return [new ActionRowBuilder().addComponents(select), buttons];
}

module.exports = {
  CATEGORIES,
  getVisibleCategories,
  getCategoryCommands,
  categoryLabel,
  buildHomeEmbed,
  buildCategoryEmbed,
  buildCommandEmbed,
  buildHelpComponents,
};
