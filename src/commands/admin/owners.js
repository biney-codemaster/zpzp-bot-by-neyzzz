const { EmbedBuilder } = require('discord.js');
const { success, error, color } = require('../../utils/embeds');
const { withEmoji } = require('../../utils/emoji');
const {
  addOwner,
  removeOwner,
  listOwnersDetailed,
} = require('../../services/owners');

function parseUserId(message, arg) {
  if (!arg && message.mentions.users.size) {
    return message.mentions.users.first().id;
  }
  if (!arg) return null;
  const mention = message.mentions.users.first();
  if (mention) return mention.id;
  const cleaned = arg.replace(/[<@!>]/g, '');
  if (/^\d{15,20}$/.test(cleaned)) return cleaned;
  return null;
}

module.exports = {
  name: 'owners',
  description: 'List bot owners, or add/remove an owner',
  category: 'admin',
  aliases: ['owner'],
  usage: '[list|add|remove] [@user|id]',
  permLevel: 'owner',
  ownerOnly: true,
  async execute(client, message, args) {
    const sub = (args[0] || 'list').toLowerCase();

    if (['list', 'ls', 'show'].includes(sub) || !args[0]) {
      const owners = listOwnersDetailed(client);
      if (!owners.length) {
        return message.reply({
          embeds: [
            error(
              'No owners configured. Set `OWNER_IDS` in the environment.'
            ),
          ],
        });
      }

      const lines = owners.map((o, i) => {
        const tag = o.root ? 'root' : 'added';
        return `\`${i + 1}.\` <@${o.id}> (\`${o.id}\`) · **${tag}**`;
      });

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(color())
            .setTitle(withEmoji('admin', 'Bot owners'))
            .setDescription(lines.join('\n'))
            .setFooter({
              text: 'Root owners come from OWNER_IDS and cannot be removed here.',
            })
            .setTimestamp(),
        ],
      });
    }

    if (['add', 'set'].includes(sub)) {
      const userId = parseUserId(message, args[1]);
      if (!userId) {
        return message.reply({
          embeds: [error('Usage: `+owners add @user` or `+owners add <id>`')],
        });
      }
      const result = addOwner(client, userId, message.author.id);
      if (!result.ok) {
        return message.reply({ embeds: [error(result.message)] });
      }
      return message.reply({
        embeds: [success(`Added owner: <@${userId}> (\`${userId}\`)`)],
      });
    }

    if (['remove', 'rm', 'delete', 'del'].includes(sub)) {
      const userId = parseUserId(message, args[1]);
      if (!userId) {
        return message.reply({
          embeds: [
            error('Usage: `+owners remove @user` or `+owners remove <id>`'),
          ],
        });
      }
      const result = removeOwner(client, userId);
      if (!result.ok) {
        return message.reply({ embeds: [error(result.message)] });
      }
      return message.reply({
        embeds: [success(`Removed owner: <@${userId}> (\`${userId}\`)`)],
      });
    }

    return message.reply({
      embeds: [
        error(
          'Usage: `+owners` · `+owners add @user` · `+owners remove @user`'
        ),
      ],
    });
  },
};
