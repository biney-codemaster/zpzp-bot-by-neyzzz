const { parseRole } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'setautorole',
  description: 'Définit le rôle automatique à l\'arrivée',
  category: 'config',
  usage: '<rôle|off>',
  permissions: ['ManageGuild', 'ManageRoles'],
  botPermissions: ['ManageRoles'],
  async execute(client, message, args) {
    if (!args[0]) return message.reply({ embeds: [error('Usage : `+setautorole @Membre` ou `+setautorole off`')] });
    if (['off', 'disable', 'none'].includes(args[0].toLowerCase())) {
      client.db.updateGuild(message.guild.id, { autorole: null });
      return message.reply({ embeds: [success('Autorole désactivé.')] });
    }
    const role = parseRole(message, args.join(' '));
    if (!role) return message.reply({ embeds: [error('Rôle introuvable.')] });
    if (role.managed || role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({ embeds: [error('Je ne peux pas attribuer ce rôle (hiérarchie).')] });
    }
    client.db.updateGuild(message.guild.id, { autorole: role.id });
    return message.reply({ embeds: [success(`Autorole : ${role}`)] });
  },
};
