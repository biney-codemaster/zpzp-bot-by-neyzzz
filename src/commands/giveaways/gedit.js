const { parseDuration, formatDuration } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
const {
  buildGiveawayEmbed,
  buildGiveawayComponents,
  refreshGiveawayMessage,
} = require('../../services/giveaways');

module.exports = {
  name: 'gedit',
  description: 'Edit an active giveaway',
  category: 'giveaways',
  usage: '<message_id> <prize|winners|duration> <value>',
  permLevel: 'owner',
  async execute(client, message, args) {
    const id = args[0] || message.reference?.messageId;
    const field = (args[1] || '').toLowerCase();
    const value = args.slice(2).join(' ');

    if (!id || !field || !value) {
      return message.reply({
        embeds: [
          error(
            [
              'Usage:',
              '`+gedit <message_id> prize New prize`',
              '`+gedit <message_id> winners 2`',
              '`+gedit <message_id> duration 30m`',
            ].join('\n')
          ),
        ],
      });
    }

    const g = client.db.getGiveaway(id);
    if (!g || g.guild_id !== message.guild.id) {
      return message.reply({ embeds: [error('Giveaway not found in this server.')] });
    }
    if (g.ended || g.cancelled) {
      return message.reply({ embeds: [error('Cannot edit an ended or cancelled giveaway.')] });
    }

    const updates = {};

    if (field === 'prize') {
      updates.prize = value.slice(0, 256);
    } else if (field === 'winners') {
      const winners = Math.floor(Number(value));
      if (!winners || winners < 1) {
        return message.reply({ embeds: [error('Winners must be a number >= 1.')] });
      }
      updates.winners = winners;
    } else if (field === 'duration') {
      const duration = parseDuration(value);
      if (!duration) {
        return message.reply({
          embeds: [error('Invalid duration (e.g. `30m`, `2h`). Sets time remaining from now.')],
        });
      }
      updates.ends_at = Date.now() + duration;
    } else {
      return message.reply({
        embeds: [error('Field must be `prize`, `winners`, or `duration`.')],
      });
    }

    client.db.updateGiveaway(id, updates);
    await refreshGiveawayMessage(client, id);

    return message.reply({
      embeds: [success(`Giveaway updated (**${field}**).`)],
    });
  },
};
