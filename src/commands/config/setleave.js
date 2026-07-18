const { parseChannel } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'setleave',
  description: 'Configure le message de départ',
  category: 'config',
  usage: '<salon|off> [message]',
  permissions: ['ManageGuild'],
  async execute(client, message, args) {
    if (!args[0]) return message.reply({ embeds: [error('Usage : `+setleave #salons {user} est parti`')] });
    if (['off', 'disable', 'none'].includes(args[0].toLowerCase())) {
      client.db.updateGuild(message.guild.id, { leave_channel: null });
      return message.reply({ embeds: [success('Leave désactivé.')] });
    }
    const channel = parseChannel(message, args[0]);
    if (!channel) return message.reply({ embeds: [error('Salon invalide.')] });
    const leaveMessage = args.slice(1).join(' ');
    const data = { leave_channel: channel.id };
    if (leaveMessage) data.leave_message = leaveMessage;
    client.db.updateGuild(message.guild.id, data);
    return message.reply({ embeds: [success(`Leave configuré dans ${channel}.`)] });
  },
};
