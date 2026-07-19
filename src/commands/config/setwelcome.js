const { parseChannel } = require('../../utils/helpers');
const { success, error, info } = require('../../utils/embeds');
module.exports = {
  name: 'setwelcome', description: 'Configure welcome messages', category: 'config', usage: '<channel|off> [message]', permLevel: 'admin',
  async execute(client, message, args) {
    if (!args[0]) return message.reply({ embeds: [info('Placeholders: `{user}` `{user.name}` `{server}` `{count}`')] });
    if (['off', 'none', 'disable'].includes(args[0].toLowerCase())) {
      client.db.updateGuild(message.guild.id, { welcome_channel: null });
      return message.reply({ embeds: [success('Welcome disabled.')] });
    }
    const channel = parseChannel(message, args[0]);
    if (!channel) return message.reply({ embeds: [error('Invalid channel.')] });
    const data = { welcome_channel: channel.id };
    const msg = args.slice(1).join(' ');
    if (msg) data.welcome_message = msg;
    client.db.updateGuild(message.guild.id, data);
    return message.reply({ embeds: [success(`Welcome channel: ${channel}`)] });
  },
};
