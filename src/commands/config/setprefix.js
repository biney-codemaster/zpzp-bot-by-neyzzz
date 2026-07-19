const { success, error } = require('../../utils/embeds');
module.exports = {
  name: 'setprefix', description: 'Change le préfixe', category: 'config', aliases: ['prefix'], usage: '<préfixe>', permLevel: 'admin',
  async execute(client, message, args) {
    const prefix = args[0];
    if (!prefix || prefix.length > 5) return message.reply({ embeds: [error('Préfixe 1 à 5 caractères.')] });
    client.db.updateGuild(message.guild.id, { prefix });
    return message.reply({ embeds: [success(`Nouveau préfixe : \`${prefix}\`\nExemple : \`${prefix}help\``)] });
  },
};
