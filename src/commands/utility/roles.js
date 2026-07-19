const { info } = require('../../utils/embeds');
module.exports = {
  name: 'roles', description: 'List server roles', category: 'utility', permLevel: 'user',
  async execute(client, message) {
    const roles = message.guild.roles.cache.filter((r) => r.id !== message.guild.id).sort((a, b) => b.position - a.position);
    return message.reply({ embeds: [info(roles.map((r) => r.toString()).join(', ').slice(0, 4000) || 'None', `Roles (${roles.size})`)] });
  },
};
