const { parseChannel } = require('../../utils/helpers');
const { success, error, info } = require('../../utils/embeds');

module.exports = {
  name: 'setwelcome',
  description: 'Configure le message de bienvenue',
  category: 'config',
  usage: '<salon|off> [message]',
  permissions: ['ManageGuild'],
  async execute(client, message, args) {
    if (!args[0]) {
      return message.reply({
        embeds: [info('Placeholders : `{user}` `{user.name}` `{server}` `{count}`\nExemple : `+setwelcome #accueil Bienvenue {user} sur {server} !`')],
      });
    }
    if (['off', 'disable', 'none'].includes(args[0].toLowerCase())) {
      client.db.updateGuild(message.guild.id, { welcome_channel: null });
      return message.reply({ embeds: [success('Welcome désactivé.')] });
    }
    const channel = parseChannel(message, args[0]);
    if (!channel) return message.reply({ embeds: [error('Salon invalide.')] });
    const welcomeMessage = args.slice(1).join(' ');
    const data = { welcome_channel: channel.id };
    if (welcomeMessage) data.welcome_message = welcomeMessage;
    client.db.updateGuild(message.guild.id, data);
    return message.reply({ embeds: [success(`Welcome configuré dans ${channel}.`)] });
  },
};
