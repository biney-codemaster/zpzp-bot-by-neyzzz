const { info } = require('../../utils/embeds');

module.exports = {
  name: 'roles',
  description: 'Liste les rôles du serveur',
  category: 'utility',
  aliases: ['rols'],
  async execute(client, message) {
    const roles = message.guild.roles.cache.filter((r) => r.id !== message.guild.id).sort((a, b) => b.position - a.position);
    const text = roles.map((r) => r.toString()).join(', ').slice(0, 4000) || 'Aucun rôle';
    return message.reply({ embeds: [info(text, `Rôles (${roles.size})`)] });
  },
};
