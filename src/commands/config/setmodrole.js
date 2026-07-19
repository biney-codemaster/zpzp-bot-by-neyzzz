const { parseRole } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
module.exports = {
  name: 'setmodrole', description: 'Définit le rôle modo bot', category: 'config', usage: '<rôle|off>', permLevel: 'admin',
  async execute(client, message, args) {
    if (!args[0]) return message.reply({ embeds: [error('Usage : `+setmodrole @Mod` / `off`')] });
    if (['off', 'none', 'disable'].includes(args[0].toLowerCase())) {
      client.db.updateGuild(message.guild.id, { mod_role: null });
      return message.reply({ embeds: [success('Rôle modo retiré.')] });
    }
    const role = parseRole(message, args.join(' '));
    if (!role) return message.reply({ embeds: [error('Rôle introuvable.')] });
    client.db.updateGuild(message.guild.id, { mod_role: role.id });
    return message.reply({ embeds: [success(`Rôle modo bot : ${role}`)] });
  },
};
