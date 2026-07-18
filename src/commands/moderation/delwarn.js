const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'delwarn',
  description: 'Supprime un avertissement par son ID',
  category: 'moderation',
  aliases: ['rmwarn'],
  usage: '<id>',
  permissions: ['ModerateMembers'],
  async execute(client, message, args) {
    const id = Number(args[0]);
    if (!id) return message.reply({ embeds: [error('Donne l\'ID du warn (`+warnings @user`).')] });
    const changes = client.db.removeWarning(message.guild.id, id);
    if (!changes) return message.reply({ embeds: [error('Aucun warn trouvé avec cet ID.')] });
    await sendModLog(client, message.guild, { action: 'DelWarn', moderator: message.author, target: null, reason: `Warn #${id} supprimé` });
    return message.reply({ embeds: [success(`Warn #${id} supprimé.`)] });
  },
};
