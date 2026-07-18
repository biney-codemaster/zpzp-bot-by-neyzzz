const { parseChannel } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'setmodlog',
  description: 'Définit le salon des logs de modération',
  category: 'config',
  usage: '<salon|off>',
  permissions: ['ManageGuild'],
  async execute(client, message, args) {
    if (['off', 'disable', 'none'].includes((args[0] || '').toLowerCase())) {
      client.db.updateGuild(message.guild.id, { modlog_channel: null });
      return message.reply({ embeds: [success('Modlogs désactivés.')] });
    }
    const channel = parseChannel(message, args[0]) || message.channel;
    client.db.updateGuild(message.guild.id, { modlog_channel: channel.id });
    return message.reply({ embeds: [success(`Salon modlog : ${channel}`)] });
  },
};
