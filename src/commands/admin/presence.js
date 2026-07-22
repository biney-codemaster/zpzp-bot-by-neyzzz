const {
  buildPresenceEmbed,
  mainMenu,
} = require('../../services/presenceSetup');

module.exports = {
  name: 'presence',
  description: 'Open the bot status and activity setup menu',
  category: 'admin',
  aliases: ['botstatus', 'activity', 'setstatus', 'setpresence'],
  usage: '',
  permLevel: 'owner',
  ownerOnly: true,
  async execute(client, message) {
    return message.reply({
      embeds: [buildPresenceEmbed(client)],
      components: mainMenu(message.author.id),
    });
  },
};
