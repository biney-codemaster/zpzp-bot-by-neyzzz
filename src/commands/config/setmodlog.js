const { parseChannel } = require('../../utils/helpers');
const { success } = require('../../utils/embeds');
module.exports = {
  name: 'setmodlog', description: 'Set the moderation log channel', category: 'config', usage: '<channel|off>', permLevel: 'admin',
  async execute(client, message, args) {
    if (['off', 'none', 'disable'].includes((args[0] || '').toLowerCase())) {
      client.db.updateGuild(message.guild.id, { modlog_channel: null });
      return message.reply({ embeds: [success('Mod logs disabled.')] });
    }
    const channel = parseChannel(message, args[0]) || message.channel;
    client.db.updateGuild(message.guild.id, { modlog_channel: channel.id });
    return message.reply({ embeds: [success(`Mod log channel: ${channel}`)] });
  },
};
