const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { parseRole } = require('../../utils/helpers');
const { color, error } = require('../../utils/embeds');

module.exports = {
  name: 'roleinfo',
  description: 'Show role info',
  category: 'utility',
  aliases: ['ri'],
  usage: '<role>',
  permLevel: 'user',
  async execute(client, message, args) {
    const role = parseRole(message, args.join(' '));
    if (!role) {
      return message.reply({ embeds: [error('Role not found.')] });
    }

    const hex = role.hexColor === '#000000' ? 'Default' : role.hexColor;
    const keyPerms = Object.entries(PermissionFlagsBits)
      .filter(([, bit]) => role.permissions.has(bit))
      .map(([name]) => name)
      .filter((name) =>
        [
          'Administrator',
          'ManageGuild',
          'ManageChannels',
          'ManageRoles',
          'ManageMessages',
          'KickMembers',
          'BanMembers',
          'ModerateMembers',
          'MentionEveryone',
          'ManageWebhooks',
          'ViewAuditLog',
        ].includes(name)
      );

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(role.color || color())
          .setTitle(role.name)
          .addFields(
            { name: 'ID', value: role.id, inline: true },
            { name: 'Color', value: hex, inline: true },
            { name: 'Members', value: `${role.members.size}`, inline: true },
            { name: 'Position', value: `${role.position}`, inline: true },
            { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
            {
              name: 'Mentionable',
              value: role.mentionable ? 'Yes' : 'No',
              inline: true,
            },
            {
              name: 'Managed',
              value: role.managed ? 'Yes (integration)' : 'No',
              inline: true,
            },
            {
              name: 'Created',
              value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`,
              inline: true,
            },
            {
              name: 'Mention',
              value: `\`${role.toString()}\``,
              inline: true,
            },
            {
              name: 'Key permissions',
              value: keyPerms.length
                ? keyPerms.map((p) => `\`${p}\``).join(', ')
                : 'None notable',
            }
          )
          .setTimestamp(),
      ],
    });
  },
};
