const { parseChannel } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');
module.exports = {
  name: 'setleave', description: 'Configure leave messages', category: 'config', usage: '<channel|off> [message]', permLevel: 'admin',
  async execute(client, message, args) {
    if (!args[0]) return message.reply({ embeds: [error('Usage: `+setleave #channel {user} left`')] });
    if (['off', 'none', 'disable'].includes(args[0].toLowerCase())) {
      client.db.updateGuild(message.guild.id, { leave_channel: null });
      return message.reply({ embeds: [success('Leave messages disabled.')] });
    }
    const channel = parseChannel(message, args[0]);
    if (!channel) return message.reply({ embeds: [error('Invalid channel.')] });
    const data = { leave_channel: channel.id };
    const msg = args.slice(1).join(' ');
    if (msg) data.leave_message = msg;
    client.db.updateGuild(message.guild.id, data);
    return message.reply({ embeds: [success(`Leave channel: ${channel}`)] });
  },
};
