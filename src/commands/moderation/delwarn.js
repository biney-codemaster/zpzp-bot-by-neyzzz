const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'delwarn',
  description: 'Delete a warning by ID',
  category: 'moderation',
  aliases: ['rmwarn'],
  usage: '<id>',
  permLevel: 'mod',
  async execute(client, message, args) {
    const id = Number(args[0]);
    if (!id) return message.reply({ embeds: [error('Invalid ID.')] });
    const changes = client.db.removeWarning(message.guild.id, id);
    if (!changes) return message.reply({ embeds: [error('Warning not found.')] });
    await sendModLog(client, message.guild, { action: 'DelWarn', moderator: message.author, target: null, reason: `Warn #${id}` });
    return message.reply({ embeds: [success(`Warning #${id} deleted.`)] });
  },
};
