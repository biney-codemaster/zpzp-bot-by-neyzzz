const { success } = require('../../utils/embeds');

module.exports = {
  name: 'togglexp',
  description: 'Active/désactive le système de niveaux',
  category: 'levels',
  aliases: ['togglelevels'],
  permissions: ['ManageGuild'],
  async execute(client, message) {
    const guild = client.db.ensureGuild(message.guild.id);
    const next = guild.levels_enabled ? 0 : 1;
    client.db.updateGuild(message.guild.id, { levels_enabled: next });
    return message.reply({ embeds: [success(next ? 'Système de niveaux **activé**.' : 'Système de niveaux **désactivé**.')] });
  },
};
