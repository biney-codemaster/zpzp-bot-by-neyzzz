const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { color } = require('./embeds');

const CATEGORIES = [
  { id: 'moderation', label: 'Modération', emoji: '🛡️', description: 'Sanctions et gestion du serveur' },
  { id: 'utility', label: 'Utilitaires', emoji: '🛠️', description: 'Infos et outils du quotidien' },
  { id: 'fun', label: 'Fun', emoji: '🎉', description: 'Jeux et commandes fun' },
  { id: 'tickets', label: 'Tickets', emoji: '🎫', description: 'Support et tickets privés' },
  { id: 'giveaways', label: 'Giveaways', emoji: '🎁', description: 'Concours et tirages' },
  { id: 'config', label: 'Configuration', emoji: '⚙️', description: 'Réglages du bot' },
  { id: 'admin', label: 'Admin', emoji: '👑', description: 'Commandes propriétaire', ownerOnly: true },
];

function cmdsIn(client, categoryId, userId) {
  return [...client.commands.values()]
    .filter((c) => {
      if (c.category !== categoryId) return false;
      if ((c.ownerOnly || c.permLevel === 'owner') && !client.config.ownerIds.includes(userId)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function visibleCategories(client, userId) {
  return CATEGORIES.filter((cat) => {
    if (cat.ownerOnly && !client.config.ownerIds.includes(userId)) return false;
    return cmdsIn(client, cat.id, userId).length > 0;
  });
}

function categoryLabel(id) {
  const cat = CATEGORIES.find((c) => c.id === id);
  return cat ? `${cat.emoji} ${cat.label}` : id;
}

function buildHomeEmbed(client, user, prefix) {
  const cats = visibleCategories(client, user.id);
  const total = [...client.commands.values()].filter((c) => {
    if ((c.ownerOnly || c.permLevel === 'owner') && !client.config.ownerIds.includes(user.id)) {
      return false;
    }
    return true;
  }).length;

  return new EmbedBuilder()
    .setColor(color())
    .setAuthor({
      name: `${client.user.username} • Centre d'aide`,
      iconURL: client.user.displayAvatarURL({ size: 128 }),
    })
    .setTitle('Accueil')
    .setDescription(
      [
        `Salut ${user}.`,
        '',
        `**Préfixe :** \`${prefix}\``,
        `**Commandes :** \`${total}\``,
        '',
        'Choisis une catégorie dans le menu ci-dessous.',
        `Détail d'une commande : \`${prefix}help <commande>\``,
      ].join('\n')
    )
    .addFields({
      name: 'Catégories',
      value: cats
        .map(
          (c) =>
            `${c.emoji} **${c.label}** — ${c.description} · \`${cmdsIn(client, c.id, user.id).length}\``
        )
        .join('\n'),
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
  const commands = cmdsIn(client, categoryId, user.id);

  const embed = new EmbedBuilder()
    .setColor(color())
    .setAuthor({
      name: `${client.user.username} • Centre d'aide`,
      iconURL: client.user.displayAvatarURL({ size: 128 }),
    })
    .setTitle(cat ? `${cat.emoji} ${cat.label}` : 'Catégorie')
    .setDescription(cat?.description || 'Commandes')
    .setFooter({
      text: `${commands.length} commande${commands.length > 1 ? 's' : ''} • ${user.username}`,
      iconURL: user.displayAvatarURL({ size: 64 }),
    })
    .setTimestamp();

  if (!commands.length) {
    return embed.addFields({ name: 'Commandes', value: '_Aucune._' });
  }

  let chunk = '';
  let part = 1;
  for (const cmd of commands) {
    const usage = cmd.usage ? ` ${cmd.usage}` : '';
    const line = `▸ \`${prefix}${cmd.name}${usage}\`\n└ ${cmd.description || '—'}\n\n`;
    if ((chunk + line).length > 1000) {
      embed.addFields({ name: part === 1 ? 'Commandes' : 'Suite', value: chunk.trimEnd() });
      chunk = line;
      part += 1;
    } else {
      chunk += line;
    }
  }
  if (chunk) {
    embed.addFields({ name: part === 1 ? 'Commandes' : 'Suite', value: chunk.trimEnd() });
  }
  return embed;
}

function buildCommandEmbed(client, command, prefix) {
  return new EmbedBuilder()
    .setColor(color())
    .setAuthor({
      name: `${client.user.username} • Commande`,
      iconURL: client.user.displayAvatarURL({ size: 128 }),
    })
    .setTitle(`${prefix}${command.name}`)
    .setDescription(command.description || '—')
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
      { name: 'Catégorie', value: categoryLabel(command.category), inline: true },
      { name: 'Permission', value: `\`${command.permLevel || 'user'}\``, inline: true }
    )
    .setTimestamp();
}

function buildHelpComponents(client, userId, selected = null) {
  const cats = visibleCategories(client, userId);
  const select = new StringSelectMenuBuilder()
    .setCustomId(`help_select:${userId}`)
    .setPlaceholder('Choisis une catégorie…')
    .addOptions(
      cats.map((c) => ({
        label: c.label,
        value: c.id,
        description: c.description.slice(0, 100),
        emoji: c.emoji,
        default: selected === c.id,
      }))
    );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`help_home:${userId}`)
      .setLabel('Accueil')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!selected),
    new ButtonBuilder()
      .setCustomId(`help_close:${userId}`)
      .setLabel('Fermer')
      .setStyle(ButtonStyle.Danger)
  );

  return [new ActionRowBuilder().addComponents(select), buttons];
}

module.exports = {
  buildHomeEmbed,
  buildCategoryEmbed,
  buildCommandEmbed,
  buildHelpComponents,
  categoryLabel,
};
