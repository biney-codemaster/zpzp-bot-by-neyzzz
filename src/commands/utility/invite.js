const { info, error } = require('../../utils/embeds');

module.exports = {
  name: 'invite',
  description: 'Génère un lien d\'invitation du bot',
  category: 'utility',
  aliases: ['inv'],
  async execute(client, message) {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
    return message.reply({ embeds: [info(`[Invite le bot](${url})`, 'Lien d\'invitation')] });
  },
};
