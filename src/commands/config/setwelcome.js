const { parseChannel } = require('../../utils/helpers');
const { success, error, info } = require('../../utils/embeds');
const {
  buildWelcomeEmbed,
  mainMenu,
} = require('../../services/welcomeSetup');

module.exports = {
  name: 'setwelcome',
  description: 'Open the welcome setup menu',
  category: 'config',
  aliases: ['welcome'],
  usage: '[channel|off] [message]',
  permLevel: 'admin',
  async execute(client, message, args) {
    if (!args[0]) {
      const guildData = client.db.ensureGuild(message.guild.id);
      return message.reply({
        embeds: [buildWelcomeEmbed(message.guild, guildData)],
        components: mainMenu(message.author.id),
      });
    }

    if (['off', 'none', 'disable'].includes(args[0].toLowerCase())) {
      client.db.updateGuild(message.guild.id, { welcome_channel: null });
      return message.reply({ embeds: [success('Welcome disabled.')] });
    }

    if (['help', 'placeholders'].includes(args[0].toLowerCase())) {
      return message.reply({
        embeds: [
          info(
            'Placeholders: `{user}` `{user.name}` `{user.tag}` `{user.id}` `{server}` `{server.id}` `{count}`\nRun `+setwelcome` with no args to open the menu.'
          ),
        ],
      });
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
