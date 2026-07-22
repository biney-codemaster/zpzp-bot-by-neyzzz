const { EmbedBuilder } = require('discord.js');
const { error, color } = require('../../utils/embeds');
const { withEmoji } = require('../../utils/emoji');
const { listOwnersDetailed } = require('../../services/owners');

module.exports = {
  name: 'owners',
  description: 'List bot owners',
  category: 'admin',
  aliases: ['ownerlist', 'listowners'],
  usage: '',
  permLevel: 'owner',
  ownerOnly: true,
  async execute(client, message) {
    const owners = listOwnersDetailed(client);
    if (!owners.length) {
      return message.reply({
        embeds: [
          error('No owners configured. Set `OWNER_IDS` in the environment.'),
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
  },
};
