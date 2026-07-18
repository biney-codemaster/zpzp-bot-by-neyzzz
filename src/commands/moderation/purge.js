const { success, error } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  name: 'purge',
  description: 'Supprime un nombre de messages (1-100)',
  category: 'moderation',
  aliases: ['clear', 'clean', 'prune'],
  usage: '<nombre> [membre]',
  permissions: ['ManageMessages'],
  botPermissions: ['ManageMessages'],
  async execute(client, message, args) {
    const amount = Number(args[0]);
    if (!amount || amount < 1 || amount > 100) {
      return message.reply({ embeds: [error('Indique un nombre entre 1 et 100.')] });
    }
    await message.delete().catch(() => null);
    let messages = await message.channel.messages.fetch({ limit: amount });
    if (message.mentions.users.size) {
      const user = message.mentions.users.first();
      messages = messages.filter((m) => m.author.id === user.id);
    }
    const deleted = await message.channel.bulkDelete(messages, true);
    await sendModLog(client, message.guild, { action: 'Purge', moderator: message.author, target: null, reason: `${deleted.size} message(s) dans #${message.channel.name}` });
    const conf = await message.channel.send({ embeds: [success(`${deleted.size} message(s) supprimé(s).`)] });
    setTimeout(() => conf.delete().catch(() => null), 4000);
  },
};
