const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { color } = require('./embeds');
const { get, applyComponentEmoji, withEmoji } = require('./emoji');

const CATEGORIES = [
  { id: 'moderation', label: 'Moderation', key: 'moderation', description: 'Sanctions and server management' },
  { id: 'utility', label: 'Utility', key: 'utility', description: 'Info and everyday tools' },
  { id: 'fun', label: 'Fun', key: 'fun', description: 'Games and fun commands' },
  { id: 'tickets', label: 'Tickets', key: 'tickets', description: 'Support tickets' },
  { id: 'giveaways', label: 'Giveaways', key: 'giveaways', description: 'Contests and draws' },
  { id: 'config', label: 'Config', key: 'config', description: 'Bot settings' },
  { id: 'admin', label: 'Admin', key: 'admin', description: 'Bot owner commands', ownerOnly: true },
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
  if (!cat) return id;
  return withEmoji(cat.key, cat.label);
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
      name: `${client.user.username} • Help Center`,
      iconURL: client.user.displayAvatarURL({ size: 128 }),
    })
    .setTitle('Home')
    .setDescription(
      [
        `Hey ${user}.`,
        '',
        `**Prefix:** \`${prefix}\``,
        `**Commands:** \`${total}\``,
        '',
        'Pick a category from the menu below.',
        `Command details: \`${prefix}help <command>\``,
      ].join('\n')
    )
    .addFields({
      name: 'Categories',
      value: cats
        .map((c) => {
          const label = withEmoji(c.key, `**${c.label}**`);
          return `${label} — ${c.description} · \`${cmdsIn(client, c.id, user.id).length}\``;
        })
        .join('\n'),
    })
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setFooter({
      text: `Requested by ${user.username}`,
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
      name: `${client.user.username} • Help Center`,
      iconURL: client.user.displayAvatarURL({ size: 128 }),
    })
    .setTitle(cat ? withEmoji(cat.key, cat.label) : 'Category')
    .setDescription(cat?.description || 'Commands')
    .setFooter({
      text: `${commands.length} command${commands.length === 1 ? '' : 's'} • ${user.username}`,
      iconURL: user.displayAvatarURL({ size: 64 }),
    })
    .setTimestamp();

  if (!commands.length) {
    return embed.addFields({ name: 'Commands', value: '_None._' });
  }

  let chunk = '';
  let part = 1;
  for (const cmd of commands) {
    const usage = cmd.usage ? ` ${cmd.usage}` : '';
    const line = `> \`${prefix}${cmd.name}${usage}\`\n${cmd.description || '-'}\n\n`;
    if ((chunk + line).length > 1000) {
      embed.addFields({ name: part === 1 ? 'Commands' : 'Continued', value: chunk.trimEnd() });
      chunk = line;
      part += 1;
    } else {
      chunk += line;
    }
  }
  if (chunk) {
    embed.addFields({ name: part === 1 ? 'Commands' : 'Continued', value: chunk.trimEnd() });
  }
  return embed;
}

function buildCommandEmbed(client, command, prefix) {
  return new EmbedBuilder()
    .setColor(color())
    .setAuthor({
      name: `${client.user.username} • Command`,
      iconURL: client.user.displayAvatarURL({ size: 128 }),
    })
    .setTitle(`${prefix}${command.name}`)
    .setDescription(command.description || '-')
    .addFields(
      {
        name: 'Usage',
        value: `\`${prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}\``,
      },
      {
        name: 'Aliases',
        value: command.aliases?.length
          ? command.aliases.map((a) => `\`${a}\``).join(', ')
          : 'None',
        inline: true,
      },
      { name: 'Category', value: categoryLabel(command.category), inline: true },
      { name: 'Permission', value: `\`${command.permLevel || 'user'}\``, inline: true }
    )
    .setTimestamp();
}

function buildHelpComponents(client, userId, selected = null) {
  const cats = visibleCategories(client, userId);

  const select = new StringSelectMenuBuilder()
    .setCustomId(`help_select:${userId}`)
    .setPlaceholder('Choose a category...')
    .addOptions(
      cats.map((c) => {
        const option = {
          label: c.label,
          value: c.id,
          description: c.description.slice(0, 100),
          default: selected === c.id,
        };
        const custom = get(c.key);
        if (custom) {
          const match = String(custom).match(/^<(a?):([\w~]+):(\d+)>$/);
          if (match) {
            option.emoji = {
              id: match[3],
              name: match[2],
              animated: match[1] === 'a',
            };
          }
        }
        return option;
      })
    );

  const homeBtn = new ButtonBuilder()
    .setCustomId(`help_home:${userId}`)
    .setLabel('Home')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(!selected);
  applyComponentEmoji(homeBtn, 'home');

  const closeBtn = new ButtonBuilder()
    .setCustomId(`help_close:${userId}`)
    .setLabel('Close')
    .setStyle(ButtonStyle.Danger);
  applyComponentEmoji(closeBtn, 'close');

  return [
    new ActionRowBuilder().addComponents(select),
    new ActionRowBuilder().addComponents(homeBtn, closeBtn),
  ];
}

module.exports = {
  buildHomeEmbed,
  buildCategoryEmbed,
  buildCommandEmbed,
  buildHelpComponents,
  categoryLabel,
};
