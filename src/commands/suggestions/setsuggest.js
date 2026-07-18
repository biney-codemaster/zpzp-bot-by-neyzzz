const { parseChannel } = require('../../utils/helpers');
const { success, error } = require('../../utils/embeds');

module.exports = {
  name: 'setsuggest',
  description: 'Définit le salon des suggestions',
  category: 'suggestions',
  usage: '<salon>',
  permissions: ['ManageGuild'],
  async execute(client, message, args) {
    const channel = parseChannel(message, args[0]) || message.channel;
    client.db.updateGuild(message.guild.id, { suggestion_channel: channel.id });
    return message.reply({ embeds: [success(`Salon des suggestions : ${channel}`)] });
  },
};
