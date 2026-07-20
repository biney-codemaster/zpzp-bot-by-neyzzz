const { info } = require('../../utils/embeds');
const { formatWarnRow } = require('../../utils/modlog');

module.exports = {
  name: 'mywarns',
  description: 'View your own warnings',
  category: 'moderation',
  aliases: ['mywarnings'],
  usage: '',
  permLevel: 'user',
  async execute(client, message) {
    const warns = client.db.getWarnings(message.guild.id, message.author.id);
    if (!warns.length) {
      return message.reply({
        embeds: [info('You have no warnings in this server.')],
      });
    }

    const list = warns.slice(0, 15).map(formatWarnRow).join('\n\n');
    return message.reply({
      embeds: [
        info(
          list,
          `Your warnings (${warns.length})`
        ),
      ],
    });
  },
};
