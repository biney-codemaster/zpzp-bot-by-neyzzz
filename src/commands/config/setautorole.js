const { PermissionFlagsBits } = require('discord.js');
const { parseRole } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
module.exports = {
  name: 'setautorole', description: 'Set the autorole on join', category: 'config', usage: '<role|off>', permLevel: 'admin',
  botPermissions: [PermissionFlagsBits.ManageRoles],
  async execute(client, message, args) {
    if (!args[0]) return message.reply({ embeds: [error('Usage: `+setautorole @Member` / `off`')] });
    if (['off', 'none', 'disable'].includes(args[0].toLowerCase())) {
      client.db.updateGuild(message.guild.id, { autorole: null });
      return message.reply({ embeds: [success('Autorole disabled.')] });
    }
    const role = parseRole(message, args.join(' '));
    if (!role) return message.reply({ embeds: [error('Role not found.')] });
    if (role.managed || role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({ embeds: [error('I cannot assign that role.')] });
    }
    client.db.updateGuild(message.guild.id, { autorole: role.id });
    return message.reply({ embeds: [success(`Autorole: ${role}`)] });
  },
};
