const { success, error } = require('../../utils/embeds');
const { removeOwner } = require('../../services/owners');
const { parseUserId } = require('../../utils/ownersHelpers');

module.exports = {
  name: 'removeowner',
  description: 'Remove a bot owner',
  category: 'admin',
  aliases: ['ownerremove'],
  usage: '<@user|id>',
  permLevel: 'owner',
  ownerOnly: true,
  async execute(client, message, args) {
    const userId = parseUserId(message, args[0]);
    if (!userId) {
      return message.reply({
        embeds: [error('Usage: `+removeowner @user` or `+removeowner <id>`')],
      });
    }

    const result = removeOwner(client, userId);
    if (!result.ok) {
      return message.reply({ embeds: [error(result.message)] });
    }

    return message.reply({
      embeds: [success(`Removed owner: <@${userId}> (\`${userId}\`)`)],
    });
  },
};
