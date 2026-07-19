const { EmbedBuilder } = require('discord.js');
const { parseRole } = require('../../utils/helpers');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'roleinfo',
  description: "Infos d'un rôle",
  category: 'utility',
  aliases: ['ri'],
  usage: '<rôle>',
  permLevel: 'user',
  async execute(client, message, args) {
    const role = parseRole(message, args.join(' '));
    if (!role) return message.reply({ embeds: [error('Rôle introuvable.')] });
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(role.color || color())
          .setTitle(role.name)
          .addFields(
            { name: 'ID', value: role.id, inline: true },
            { name: 'Membres', value: `${role.members.size}`, inline: true },
            { name: 'Position', value: `${role.position}`, inline: true },
            { name: 'Créé', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true }
          ),
      ],
    });
  },
};
