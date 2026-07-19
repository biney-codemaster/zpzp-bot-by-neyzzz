const { parseRole } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
module.exports = {
  name: 'setmodrole', description: 'Set the bot mod role', category: 'config', usage: '<role|off>', permLevel: 'admin',
  async execute(client, message, args) {
    if (!args[0]) return message.reply({ embeds: [error('Usage: `+setmodrole @Mod` / `off`')] });
    if (['off', 'none', 'disable'].includes(args[0].toLowerCase())) {
      client.db.updateGuild(message.guild.id, { mod_role: null });
      return message.reply({ embeds: [success('Mod role cleared.')] });
    }
    const role = parseRole(message, args.join(' '));
    if (!role) return message.reply({ embeds: [error('Role not found.')] });
    client.db.updateGuild(message.guild.id, { mod_role: role.id });
    return message.reply({ embeds: [success(`Bot mod role: ${role}`)] });
  },
};
