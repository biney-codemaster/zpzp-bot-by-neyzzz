const { parseChannel } = require('../../utils/helpers');
const { success, error, info } = require('../../utils/embeds');
const {
  buildLeaveEmbed,
  mainMenu,
} = require('../../services/leaveSetup');

module.exports = {
  name: 'setleave',
  description: 'Open the leave setup menu',
  category: 'config',
  aliases: ['leave'],
  usage: '[channel|off] [message]',
  permLevel: 'owner',
  async execute(client, message, args) {
    if (!args[0]) {
      const guildData = client.db.ensureGuild(message.guild.id);
      return message.reply({
        embeds: [buildLeaveEmbed(message.guild, guildData)],
        components: mainMenu(message.author.id),
      });
    }

    if (['off', 'none', 'disable'].includes(args[0].toLowerCase())) {
      client.db.updateGuild(message.guild.id, { leave_channel: null });
      return message.reply({ embeds: [success('Leave messages disabled.')] });
    }

    if (['help', 'placeholders'].includes(args[0].toLowerCase())) {
      return message.reply({
        embeds: [
          info(
            'Placeholders: `{user}` `{user.name}` `{user.tag}` `{user.id}` `{server}` `{server.id}` `{count}`\nRun `+setleave` with no args to open the menu.'
          ),
        ],
      });
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
