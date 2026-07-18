const { parseChannel } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'setlevelchannel',
  description: 'Salon des annonces de level-up',
  category: 'config',
  aliases: ['setlvlchannel'],
  usage: '<salon|off>',
  permissions: ['ManageGuild'],
  async execute(client, message, args) {
    if (['off', 'disable', 'none'].includes((args[0] || '').toLowerCase())) {
      client.db.updateGuild(message.guild.id, { level_channel: null });
      return message.reply({ embeds: [success('Les level-up seront envoyés dans le salon du message.')] });
    }
    const channel = parseChannel(message, args[0]) || message.channel;
    client.db.updateGuild(message.guild.id, { level_channel: channel.id });
    return message.reply({ embeds: [success(`Salon level-up : ${channel}`)] });
  },
};
