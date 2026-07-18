const { EmbedBuilder } = require('discord.js');
const { parseRole } = require('../../utils/helpers');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'roleinfo',
  description: 'Infos sur un rôle',
  category: 'utility',
  aliases: ['ri'],
  usage: '<rôle>',
  async execute(client, message, args) {
    const role = parseRole(message, args.join(' '));
    if (!role) return message.reply({ embeds: [error('Rôle introuvable.')] });
    const embed = new EmbedBuilder()
      .setColor(role.color || color())
      .setTitle(role.name)
      .addFields(
        { name: 'ID', value: role.id, inline: true },
        { name: 'Membres', value: `${role.members.size}`, inline: true },
        { name: 'Mentionnable', value: role.mentionable ? 'Oui' : 'Non', inline: true },
        { name: 'Affiché séparément', value: role.hoist ? 'Oui' : 'Non', inline: true },
        { name: 'Position', value: `${role.position}`, inline: true },
        { name: 'Créé', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true }
      );
    return message.reply({ embeds: [embed] });
  },
};
