const { success, error } = require('../../utils/embeds');
const { addOwner } = require('../../services/owners');
const { parseUserId } = require('../../utils/ownersHelpers');

module.exports = {
  name: 'addowner',
  description: 'Add a bot owner',
  category: 'admin',
  aliases: ['owneradd'],
  usage: '<@user|id>',
  permLevel: 'owner',
  ownerOnly: true,
  async execute(client, message, args) {
    const userId = parseUserId(message, args[0]);
    if (!userId) {
      return message.reply({
        embeds: [error('Usage: `+addowner @user` or `+addowner <id>`')],
      });
    }

    const result = addOwner(client, userId, message.author.id);
    if (!result.ok) {
      return message.reply({ embeds: [error(result.message)] });
    }

    return message.reply({
      embeds: [success(`Added owner: <@${userId}> (\`${userId}\`)`)],
    });
  },
};
