const { EmbedBuilder } = require('discord.js');
const { color, error } = require('../../utils/embeds');

const categoryNames = {
  moderation: '🛡️ Modération',
  utility: '🛠️ Utilitaires',
  fun: '🎉 Fun',
  economy: '💰 Économie',
  levels: '📈 Niveaux',
  tickets: '🎫 Tickets',
  suggestions: '💡 Suggestions',
  giveaways: '🎁 Giveaways',
  config: '⚙️ Configuration',
  admin: '👑 Admin',
};

module.exports = {
  name: 'help',
  description: 'Affiche la liste des commandes',
  category: 'utility',
  aliases: ['aide', 'commands', 'cmds'],
  usage: '[commande]',
  async execute(client, message, args) {
    const prefix = client.db.getPrefix(message.guild.id);

    if (args[0]) {
      const name = args[0].toLowerCase();
      const command =
        client.commands.get(name) || client.commands.get(client.aliases.get(name));
      if (!command) {
        return message.reply({ embeds: [error('Commande introuvable.')] });
      }

      const embed = new EmbedBuilder()
        .setColor(color())
        .setTitle(`Commande : ${prefix}${command.name}`)
        .setDescription(command.description || 'Pas de description')
        .addFields(
          {
            name: 'Usage',
            value: `\`${prefix}${command.name} ${command.usage || ''}\``.trim(),
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
            value: categoryNames[command.category] || command.category,
            inline: true,
          },
          {
            name: 'Cooldown',
            value: `${command.cooldown || 3}s`,
            inline: true,
          }
        );

      return message.reply({ embeds: [embed] });
    }

    const grouped = new Map();
    for (const cmd of client.commands.values()) {
      if (cmd.ownerOnly && !client.config.ownerIds.includes(message.author.id)) continue;
      if (!grouped.has(cmd.category)) grouped.set(cmd.category, []);
      grouped.get(cmd.category).push(cmd.name);
    }

    const embed = new EmbedBuilder()
      .setColor(color())
      .setTitle("📚 Menu d'aide — ZPZP Bot")
      .setDescription(
        `Préfixe actuel : \`${prefix}\`\nUtilise \`${prefix}help <commande>\` pour plus de détails.`
      )
      .setFooter({
        text: `${client.commands.size} commandes • Demandé par ${message.author.username}`,
      })
      .setTimestamp();

    for (const [cat, names] of [...grouped.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    )) {
      embed.addFields({
        name: categoryNames[cat] || cat,
        value: names
          .sort()
          .map((n) => `\`${n}\``)
          .join(', '),
      });
    }

    return message.reply({ embeds: [embed] });
  },
};
