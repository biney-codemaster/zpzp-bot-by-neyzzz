const { EmbedBuilder } = require('discord.js');
const { parseRole } = require('../../utils/helpers');
const { color, error } = require('../../utils/embeds');
module.exports = {
  name: 'roleinfo', description: 'Show role info', category: 'utility', aliases: ['ri'], usage: '<role>', permLevel: 'user',
  async execute(client, message, args) {
    const role = parseRole(message, args.join(' '));
    if (!role) return message.reply({ embeds: [error('Role not found.')] });
    return message.reply({ embeds: [new EmbedBuilder().setColor(role.color || color()).setTitle(role.name).addFields(
      { name: 'ID', value: role.id, inline: true },
      { name: 'Members', value: `${role.members.size}`, inline: true },
      { name: 'Position', value: `${role.position}`, inline: true },
      { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true }
    )] });
  },
};
